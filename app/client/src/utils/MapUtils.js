/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
import Projection from 'ol/proj/Projection';
import TileGrid from 'ol/tilegrid/TileGrid';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Vector from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import {getTopLeft, getBottomLeft} from 'ol/extent';
import WKT from 'ol/format/WKT';
import {getArea} from 'ol/sphere';

export function isWithinVisibleScales(scale, maxScale, minScale) {
  if (maxScale || minScale) {
    // Alter 1: maxscale and minscale
    if (maxScale && minScale) {
      if (scale > maxScale && scale < minScale) {
        return true;
      }
    } else if (maxScale) {
      // Alter 2: only maxscale
      if (scale > maxScale) {
        return true;
      }
    } else if (minScale) {
      // Alter 3: only minscale
      if (scale < minScale) {
        return true;
      }
    }
  } else {
    // Alter 4: no scale limit
    return true;
  }
  return false;
}

export function customProjection(projectionCode, extent) {
  return new Projection({
    code: projectionCode,
    extent,
  });
}

export function getLayerName(layer) {
  if (!layer) {
    return '';
  }
  if (layer.get('name')) {
    return layer.get('name');
  }
  if (!layer.getUrl) return '';

  const layerUrl = layer.getSource().getUrl();
  const layerName = layerUrl.substring(layerUrl.lastIndexOf('/') + 1, layerUrl.lastIndexOf('.'));
  return layerName;
}

export function tileGrid(settings, defaultSettings = {}) {
  const tileGridSettings = {...defaultSettings, ...settings};
  const extent = tileGridSettings.extent;
  tileGridSettings.origin = tileGridSettings.alignBottomLeft === false ? getTopLeft(extent) : getBottomLeft(extent);
  return new TileGrid(tileGridSettings);
}

export function checkZoomChange(resolution, currentResolution) {
  if (resolution !== currentResolution) {
    return true;
  }

  return false;
}

export function createPointFeature(coordinate, style) {
  const feature = new Feature({
    geometry: new Point(coordinate),
  });
  feature.setStyle(style);
  return feature;
}

export function geojsonToFeature(obj, options) {
  const vectorSource = new Vector({
    features: new GeoJSON().readFeatures(obj, options),
  });
  return vectorSource.getFeatures();
}

export function findClosestFeatureToCoordinate(features, coordinate) {
  let vectorSource;
  let nearestFeature;
  if (Array.isArray(features) && features.length > 0 && features[0] instanceof Feature) {
    vectorSource = new Vector({
      features,
    });
  } else if (features instanceof Vector) {
    // In case vector is passed
    vectorSource = features;
  }
  if (vectorSource) {
    nearestFeature = vectorSource.getClosestFeatureToCoordinate(coordinate);
  }
  return nearestFeature;
}

export function featuresToGeojson(features, sourceProjection) {
  const format = new GeoJSON({featureProjection: sourceProjection});
  const json = format.writeFeatures(features);
  return json;
}

export function wktToFeature(wkt, srsName) {
  const format = new WKT();
  const feature = format.readFeature(wkt, {
    dataProjection: srsName,
    featureProjection: srsName,
  });
  return feature;
}

export function getCenter(geometry) {
  const type = geometry.getType();
  let center;
  switch (type) {
    case 'Polygon':
      center = geometry.getInteriorPoint().getCoordinates();
      break;
    case 'MultiPolygon':
      center = geometry.getInteriorPoints().getFirstCoordinate();
      break;
    case 'Point':
      center = geometry.getCoordinates();
      break;
    case 'MultiPoint':
      center = geometry[0].getCoordinates();
      break;
    case 'LineString':
      center = geometry.getCoordinateAt(0.5);
      break;
    case 'MultiLineString':
      center = geometry.getLineStrings()[0].getCoordinateAt(0.5);
      break;
    case 'Circle':
      center = geometry.getCenter();
      break;
    default:
      break;
  }
  return center;
}

export function getPolygonArea(polygon) {
  const type = polygon.getType();
  let output = '';
  if (type === 'Polygon' || type === 'MultiPolygon') {
    const area = getArea(polygon);
    output = `${Math.round((area / 1000000) * 100) / 100} km²`;
  }
  return output;
}

export function resolutionToScale(resolution, projection) {
  const dpi = 25.4 / 0.28;
  const mpu = projection.getMetersPerUnit();
  let scale = resolution * mpu * 39.37 * dpi;
  scale = Math.round(scale);
  return scale;
}

export function scaleToResolution(scale, projection) {
  const dpi = 25.4 / 0.28;
  const mpu = projection.getMetersPerUnit();
  const resolution = scale / (mpu * 39.37 * dpi);
  return resolution;
}

export function flyTo(destination, map, done) {
  const duration = 2000;
  const view = map.getView();
  const zoom = view.getZoom();
  let parts = 2;
  let called = false;
  function callback(complete) {
    --parts;
    if (called) {
      return;
    }
    if (parts === 0 || !complete) {
      called = true;
      done(complete);
    }
  }
  view.animate(
    {
      center: destination,
      duration,
    },
    callback
  );
  view.animate(
    {
      zoom: zoom - 1,
      duration: duration / 2,
    },
    {
      zoom,
      duration: duration / 2,
    },
    callback
  );
}

// Converts from degrees to radians.
export function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

// Converts from radians to degrees.
export function toDegrees(radians) {
  return (radians * 180) / Math.PI;
}

export function calculateBearing(startLat, startLng, destLat, destLng) {
  startLat = toRadians(startLat);
  startLng = toRadians(startLng);
  destLat = toRadians(destLat);
  destLng = toRadians(destLng);

  const y = Math.sin(destLng - startLng) * Math.cos(destLat);
  const x =
    Math.cos(startLat) * Math.sin(destLat) - Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
  let brng = Math.atan2(y, x);
  brng = toDegrees(brng);
  return (brng + 360) % 360;
}
