const { DataTypes, Model } = require("sequelize");
const sequelize = require("../db");
const crypto    = require("crypto");

class User extends Model {
  static hashPassword(password) {
    return crypto.createHash("sha256").update(password).digest("hex");
  }

  toPublic() {
    const { password_hash, ...rest } = this.toJSON();
    return rest;
  }
}

User.init(
  {
    id:                  { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name:                { type: DataTypes.STRING,  allowNull: false },
    email:               { type: DataTypes.STRING,  allowNull: false, unique: true },
    cpf:                 { type: DataTypes.STRING,  allowNull: false, unique: true },
    gender:              { type: DataTypes.STRING,  allowNull: false },
    password_hash:       { type: DataTypes.STRING,  allowNull: false },
    onboarding_complete: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { sequelize, modelName: "User", tableName: "users", underscored: true }
);

module.exports = User;
