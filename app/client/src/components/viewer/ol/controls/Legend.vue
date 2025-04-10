<template>
  <div>
    <v-tooltip v-show="!isVisible" right>
      <template v-slot:activator="{on}">
        <v-btn
          v-on="on"
          :style="`position:absolute;${$vuetify.breakpoint.smAndDown ? 'right' : 'left'}:16px;bottom:${
            $vuetify.breakpoint.smAndDown && !mobilePanelState ? 70 : 40
          }px;z-index:1;`"
          v-show="!isVisible"
          :color="color"
          @click="toggleLegend"
          fab
          small
          class="white--text"
        >
          <v-icon>fas fa-layer-group</v-icon>
        </v-btn>
      </template>
      <span>{{ $t('general.layers') }}</span>
    </v-tooltip>
    <v-expansion-panels
      v-model="panel"
      v-show="isVisible"
      class="elevation-3"
      :width="isVisible ? '250px' : '0px'"
      :style="`position:absolute;${$vuetify.breakpoint.smAndDown ? 'right' : 'left'}:25px;bottom:${
        $vuetify.breakpoint.smAndDown && !mobilePanelState ? 70 : 20
      }px;max-width:190px;opacity:85%;z-index:1000;`"
    >
      <v-btn
        v-show="isVisible"
        @click="toggleLegend"
        class="legend-toggle-button white--text"
        text
        min-width="30px"
        x-small
        :style="`z-index:100;background-color:${color};position:absolute;bottom:30px;right:-19px;`"
      >
        <v-icon class="ml-0" x-small>fas fa-chevron-up</v-icon>
      </v-btn>
      <v-expansion-panel class="my-0" :style="`background-color: white;`">
        <!--<v-row class="my-1" justify="center">
          <span class="grey--text text--darken-2 subtitle-2">
            <a @click="toggleAllLayersVisibility(true)">{{ $t(`form.legend.selectAll`) }}</a> |
            <a @click="toggleAllLayersVisibility(false)"> {{ $t(`form.legend.clearAll`) }}</a>
          </span>
        </v-row> -->
        <v-divider class="mb-1"></v-divider>
        <v-expansion-panel-content style="max-height: 400px" v-show="isVisible" v-if="isReady">
          <vue-scroll style="height: calc(100% + 5px)">
            <template v-for="(item, index) in layers">
              <v-row
                :key="'layer-' + index"
                class="fill-height ma-0"
                v-if="item.get('displayInLegend')"
                v-show="item.get('group') !== 'backgroundLayers' && item.get('isVisibleInResolution') === true"
              >
                <template v-if="item.get('displaySidebarInfo')">
                  <v-tooltip right>
                    <template v-slot:activator="{on}">
                      <v-flex v-on="on" @click="handleMoreInfoClick(item)" style="cursor: pointer" xs1>
                        <span v-html="getGraphic(item)"></span>
                      </v-flex>
                    </template>
                    More Information
                  </v-tooltip>
                </template>
                <template v-else>
                  <v-flex xs1>
                    <span v-html="getGraphic(item)"></span>
                  </v-flex>
                </template>

                <v-flex xs11>
                  <v-checkbox
                    class="layer-input ml-1 pt-1 py-0 my-0"
                    dense
                    color="purple"
                    :input-value="item.getVisible()"
                    @change="toggleLayerVisibility(item)"
                  >
                    <template v-slot:label>
                      <span
                        :class="{
                          'text--darken-2 subtitle-2': true,
                          'blue--text': item.get('displaySidebarInfo') ? true : false,
                        }"
                      >
                        {{
                          item.get('legendDisplayName')[$i18n.locale] ||
                          (typeof item.get('legendDisplayName') === 'object' &&
                            Object.values(item.get('legendDisplayName'))[0]) ||
                          item.get('legendDisplayName') ||
                          humanize(item.get('name'))
                        }}
                      </span>
                    </template>
                  </v-checkbox>
                </v-flex>
              </v-row>
              <v-row
                align="center"
                justify="center"
                v-if="isSliderVisible(item)"
                :key="'time-series' + index"
                class="fill-height ma-0 pa-0"
              >
                <span class="text--darken-2 subtitle-2 mt-n2 mb-n2">{{ getSeriesActiveLayerTitle(item) }}</span>
                <v-flex xs11>
                  <v-slider
                    hide-details
                    class="ml-4 mr-3 pb-0 mb-1"
                    step="1"
                    :value="item.get('defaultSeriesLayerIndex') || 0"
                    :max="item.getLayers().getArray().length - 1"
                    ticks
                    @change="activateTimeSeriesLayer($event, item)"
                  >
                  </v-slider>
                </v-flex>
              </v-row>
            </template>
          </vue-scroll>
        </v-expansion-panel-content>
        <v-divider></v-divider>
        <!-- <v-row class="my-1" justify="center">
          <span class="black--text text--darken-2 subtitle-2">
            {{ title[$i18n.locale] || (typeof title === 'object' && Object.values(title)[0]) || title }}
          </span>
        </v-row> -->
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>
<script>
import {mapGetters} from 'vuex';
import {mapFields} from 'vuex-map-fields';
import {Mapable} from '../../../../mixins/Mapable';
import {humanize, debounce} from '../../../../utils/Helpers';
import {getLayerType} from '../../../../utils/Layer';

export default {
  mixins: [Mapable],
  name: 'map-legend',
  props: {
    color: {type: String, default: '#4CAF50'},
  },
  data() {
    return {
      panel: 0,
      isReady: false,
      title: '',
      isVisible: this.$vuetify.breakpoint.smAndDown ? false : this.$appConfig.app.legend.isVisible,
    };
  },
  methods: {
    humanize,
    onMapBound() {
      this.updateRows();
      this.map.getView().on('change:resolution', () => {
        this.updateLegendRows();
      });
    },
    updateLegendRows: debounce(function () {
      this.updateRows();
    }, 500),
    updateRows() {
      const currentRes = this.map.getView().getResolution();
      Object.keys(this.layers).forEach(key => {
        const layer = this.layers[key];

        const minRes = layer.getMinResolution();
        const maxRes = layer.getMaxResolution();
        if (currentRes >= minRes && currentRes <= maxRes) {
          layer.set('isVisibleInResolution', true);
        } else {
          layer.set('isVisibleInResolution', false);
        }
        if (this.isReady === false) {
          this.isReady = true;
        }
        this.$forceUpdate();
      });
    },
    getGraphic(layer) {
      const layerType = getLayerType(layer);
      if (layer.get('legendIcon') || layerType === 'VectorLayer' || layerType === 'VectorTileLayer') {
        let styleConf = layer.get('styleObj');
        if (!styleConf && !layer.get('legendIcon')) return;
        // eslint-disable-next-line no-unused-expressions
        styleConf ? (styleConf = JSON.parse(styleConf)) : (styleConf = {});
        if (styleConf.iconUrl || layer.get('legendIcon')) {
          const iconUrl = styleConf.iconUrl || layer.get('legendIcon');
          return `<img src="${iconUrl}" style="margin-top: 5px !important;object-fit:contain;" width="18" height="22">`;
        }
        if (styleConf.radius || styleConf.type === 'circle') {
          return `<span class="circle" style="margin-top: 5px;background-color:${styleConf.fillColor};border: 1px solid ${styleConf.strokeColor};"></span>`;
        }
        if (styleConf.fillColor) {
          // Polygon
          return `<span class="square" style="margin-top: 5px;background-color:${styleConf.fillColor};border: 1px solid ${styleConf.strokeColor};"></span>`;
        }
        if (styleConf.strokeColor || styleConf.strokeWidth) {
          let lineType = 'solid';
          const lineWidth = '2px';

          if (styleConf.lineDash) {
            lineType = 'dashed';
          }
          if (!styleConf.strokeColor) {
            styleConf.strokeColor = 'black';
          }

          if (styleConf.styleField && styleConf.type === 'line') {
            const features = layer.getSource().getFeatures();
            if (styleConf.legendColor) {
              styleConf.strokeColor = styleConf.legendColor;
            } else if (Array.isArray(features) && features.length > 0) {
              styleConf.strokeColor = features[0].get(styleConf.styleField);
            }
          }

          return `<hr style="margin-top: 12px;border: ${lineWidth} ${lineType} ${styleConf.strokeColor};"></hr>`;
        }
      }
    },
    handleMoreInfoClick(item) {
      this.lastSelectedLayer = this.lastSelectedLayer === item.get('name') ? undefined : item.get('name');
      if (!this.sidebarState) {
        this.sidebarState = true;
      }
    },
    toggleLayerVisibility(item) {
      this.lastSelectedLayer = null;

      item.setVisible(!item.getVisible());
      // Show html in the sidebar.
      if (item.getVisible() && item.get('displaySidebarInfo')) {
        this.lastSelectedLayer = item.get('name');
        this.mobilePanelState = true;
      }

      if (item.get('displaySeries') && item.getVisible()) {
        this.activateTimeSeriesLayer(
          item.get('defaultSeriesLayerIndex') || 0, // default to first layer
          item
        );
      }
    },
    toggleAllLayersVisibility(state) {
      Object.keys(this.layers).forEach(key => {
        const layer = this.layers[key];
        if (layer.get('isVisibleInResolution') && layer.get('displayInLegend')) {
          layer.setVisible(state);
        }
      });
    },
    updateTitle() {
      let title = '';
      this.navbarGroups.forEach(navbarGroup => {
        if (navbarGroup.name === this.activeLayerGroup.navbarGroup) {
          title = navbarGroup.title;
        }
      });
      for (const region of this.regions) {
        if (region.name === this.activeLayerGroup.region && region.name !== 'default') {
          if (typeof title === 'object') {
            let navbarGroupTitle = {};
            if (typeof region.title === 'object') {
              const languages = [...new Set([...Object.keys(title), ...Object.keys(region.title)])];
              for (const language of languages) {
                navbarGroupTitle[language] =
                  (title[language] || Object.values(title)[0]) +
                  ` (${region.title[language] || Object.values(region.title)[0]})`;
              }
            } else {
              for (const language in title) {
                navbarGroupTitle[language] = title[language] + ` (${region.title})`;
              }
            }
            title = navbarGroupTitle;
          } else {
            let regionTitle = {};
            if (typeof region.title === 'object') {
              for (const language in region.title) {
                regionTitle[language] = title + ` (${region.title[language]})`;
              }
              title = regionTitle;
            } else {
              title += ` (${region.title})`;
            }
          }
        }
      }
      this.title = title;
    },
    toggleLegend() {
      this.isVisible = !this.isVisible;
    },
    activateTimeSeriesLayer(index, layerGroup) {
      const layers = layerGroup.getLayers().getArray();
      layers.forEach(layer => {
        layer.setVisible(false);
      });
      layers[index].setVisible(true);
      this.$nextTick(() => {
        this.updateRows();
      });
      layerGroup.set('activeLayerIndex', index);
    },
    getSeriesActiveLayerTitle(layerGroup) {
      const layers = layerGroup.getLayers().getArray();
      const activeLayerIndex = layerGroup.get('activeLayerIndex') || 0;
      const title =
        layers[activeLayerIndex].get('legendDisplayName') &&
        layers[activeLayerIndex].get('legendDisplayName')[this.$i18n.locale]
          ? layers[activeLayerIndex].get('legendDisplayName')[this.$i18n.locale]
          : layers[activeLayerIndex].get('name');
      return title;
    },
    isSliderVisible(layer) {
      const hasDisplaySeries = layer?.get('displaySeries');
      const isVisible = layer?.getVisible();
      const hasMultipleLayers = layer?.getLayers?.().getArray().length >= 2;

      if (hasDisplaySeries && isVisible && hasMultipleLayers) {
        if (this.$vuetify.breakpoint.smAndDown || !layer.get('largeSlider')) {
          return true;
        }
      }

      return false;
    },
  },
  mounted() {
    this.updateTitle();
  },
  computed: {
    ...mapGetters('map', {
      layers: 'layers',
      activeLayerGroup: 'activeLayerGroup',
      navbarGroups: 'navbarGroups',
      regions: 'regions',
      mobilePanelState: 'mobilePanelState',
    }),
    ...mapGetters('app', {
      sidebarHtml: 'sidebarHtml',
    }),
    ...mapFields('map', {
      lastSelectedLayer: 'lastSelectedLayer',
      mobilePanelState: 'mobilePanelState',
    }),
    ...mapFields('app', {
      sidebarState: 'sidebarState',
    }),
  },
  watch: {
    activeLayerGroup() {
      this.updateTitle();
      this.updateLegendRows();
    },
  },
};
</script>
<style lang="css" scoped>
.v-expansion-panel-header {
  min-height: 30px;
  padding: 5px;
}

.v-expansion-panel-content >>> .v-expansion-panel-content__wrap {
  padding: 2px 0px 0px 5px;
}

.layer-input >>> .v-messages {
  min-height: 0px;
}

.legend-toggle-button {
  transform: rotate(-90deg);
  -ms-transform: rotate(-90deg);
  -moz-transform: rotate(-90deg);
  -webkit-transform: rotate(-90deg);
  -o-transform: rotate(-90deg);
  transform-origin: bottom right;
}

/* * {
  scrollbar-width: thin;
  scrollbar-color: rgb(206, 206, 206) #ffffff;
}
*::-webkit-scrollbar {
  width: 12px;
}
*::-webkit-scrollbar-track {
  background: #ffffff;
}
*::-webkit-scrollbar-thumb {
  background-color: rgb(206, 206, 206);
  border-radius: 20px;
  border: 3px solid #ffffff;
} */
</style>
