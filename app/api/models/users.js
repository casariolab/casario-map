const { v4: uuidv4 } = require('uuid');
'use strict';
module.exports = (sequelize, DataTypes) => {
  var Users = sequelize.define('_users', {
    userID: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: uuidv4(),
      allowNull: false,
    },
    relatedRoleID: DataTypes.INTEGER,
    firstName: DataTypes.STRING(50),
    lastName: DataTypes.STRING(100),
    userName: {
      type: DataTypes.STRING(50),
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      unique: true
    }
  });
  return Users;
};
