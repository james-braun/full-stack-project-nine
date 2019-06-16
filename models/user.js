'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    emailAddress: DataTypes.STRING,
    password: DataTypes.STRING,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  }, {});
  User.associate = function(models) {
      User.hasMany(models.Course, {
          as: 'Courses',
          foreignKey: {
              fieldName: 'coursesCourseId',
              allowNull: false,
          },
      });
  };
  return User;
};