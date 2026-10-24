const Post = require("../models/Post");

class PostController {
  static async create(req, res) {
    try {
      const { userId, content, anonymous } = req.body;
      if (!userId || !content)
        return res.status(400).json({ error: "Campos obrigatórios: userId, content" });
      const post = await Post.create({ user_id: userId, content, anonymous: !!anonymous });
      return res.status(201).json(post);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async listAll(_req, res) {
    const posts = await Post.findAll({ order: [["created_at", "DESC"]] });
    return res.json(posts);
  }

  static async listByUser(req, res) {
    const posts = await Post.findAll({ where: { user_id: req.params.userId }, order: [["created_at", "DESC"]] });
    return res.json(posts);
  }
}

module.exports = PostController;
