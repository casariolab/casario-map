'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('_users', {
      userID: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      relatedRoleID: {
        type: Sequelize.INTEGER,
        references: {
          model: '_roles', // foreign key on roles
          key: 'roleID'
        }
      },
      firstName: Sequelize.STRING(50),
      lastName: Sequelize.STRING(100),
      userName: {
        type: Sequelize.STRING(50),
        unique: true
      },
      email: {
        type: Sequelize.STRING,
        unique: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('_users');
  }
};
