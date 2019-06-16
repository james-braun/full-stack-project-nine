'use strict';
module.exports = (sequelize, DataTypes) => {
  const sqlite_sequence = sequelize.define('sqlite_sequence', {
    name: DataTypes.TEXT,
    seq: DataTypes.TEXT
  }, {});
  sqlite_sequence.associate = function(models) {
    // associations can be defined here
  };
  return sqlite_sequence;
};