const { DataTypes, Model } = require("sequelize");
const sequelize = require("../db");

class Alert extends Model {}

Alert.init(
  {
    id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id:     { type: DataTypes.INTEGER, allowNull: false },
    status:      { type: DataTypes.STRING,  defaultValue: "pending" },
    latitude:    { type: DataTypes.FLOAT,   allowNull: true },
    longitude:   { type: DataTypes.FLOAT,   allowNull: true },
    resolved_at: { type: DataTypes.DATE,    allowNull: true },
  },
  { sequelize, modelName: "Alert", tableName: "alerts", underscored: true }
);

module.exports = Alert;
