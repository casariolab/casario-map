'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('_logins', {
      loginID: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      userName: {
        type: Sequelize.STRING(50),
        unique: true
      },
      passwordSalt: Sequelize.STRING,
      passwordHash: Sequelize.STRING,
      relatedUserID: {
        type: Sequelize.UUID,
        references: {
          model: '_users', // foreign key on users
          key: 'userID'
        },
      },
      relatedRoleID: {
        type: Sequelize.INTEGER,
        references: {
          model: '_roles', // foreign key on users
          key: 'roleID'
        },
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
    return queryInterface.dropTable('_logins');
  }
};
