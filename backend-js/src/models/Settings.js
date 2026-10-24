const { DataTypes, Model } = require("sequelize");
const sequelize = require("../db");

class Settings extends Model {}

Settings.init(
  {
    id:                { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id:           { type: DataTypes.INTEGER, allowNull: false, unique: true },
    timer_duration:    { type: DataTypes.INTEGER, defaultValue: 60 },
    fake_call_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    shake_enabled:     { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { sequelize, modelName: "Settings", tableName: "settings", underscored: true }
);

module.exports = Settings;
