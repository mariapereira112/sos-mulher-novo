const { DataTypes, Model } = require("sequelize");
const sequelize = require("../db");

class Contact extends Model {}

Contact.init(
  {
    id:           { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id:      { type: DataTypes.INTEGER, allowNull: false },
    name:         { type: DataTypes.STRING,  allowNull: false },
    phone:        { type: DataTypes.STRING,  allowNull: false },
    relationship: { type: DataTypes.STRING,  allowNull: true },
  },
  { sequelize, modelName: "Contact", tableName: "contacts", underscored: true }
);

module.exports = Contact;
