const { DataTypes, Model } = require("sequelize");
const sequelize = require("../db");

class Post extends Model {}

Post.init(
  {
    id:        { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id:   { type: DataTypes.INTEGER, allowNull: false },
    content:   { type: DataTypes.TEXT,    allowNull: false },
    anonymous: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { sequelize, modelName: "Post", tableName: "posts", underscored: true }
);

module.exports = Post;
