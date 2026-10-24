const User = require("../models/User");

class UserController {
  static async create(req, res) {
    try {
      const { name, email, cpf, gender, password } = req.body;
      if (!name || !email || !cpf || !gender || !password)
        return res.status(400).json({ error: "Campos obrigatórios: name, email, cpf, gender, password" });
      if (gender === "Homem")
        return res.status(403).json({ error: "restricted", redirect: "/acesso-restrito" });
      if (await User.findOne({ where: { cpf } }))
        return res.status(409).json({ error: "CPF já cadastrado" });

      const user = await User.create({ name, email, cpf, gender, password_hash: User.hashPassword(password) });
      return res.status(201).json(user.toPublic());
    } catch (err) {
      if (err.name === "SequelizeUniqueConstraintError")
        return res.status(409).json({ error: "Email já cadastrado" });
      return res.status(500).json({ error: err.message });
    }
  }

  static async getById(req, res) {
    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    return res.json(user.toPublic());
  }

  static async update(req, res) {
    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    const allowed = ["name", "email", "cpf", "gender"];
    allowed.forEach(k => { if (req.body[k] !== undefined) user[k] = req.body[k]; });
    await user.save();
    return res.json(user.toPublic());
  }

  static async completeOnboarding(req, res) {
    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    await user.update({ onboarding_complete: true });
    return res.json(user.toPublic());
  }

  static async login(req, res) {
    const { name, password } = req.body;
    if (!name || !password)
      return res.status(400).json({ error: "Campos obrigatórios: name, password" });
    const user = await User.findOne({ where: { name } });
    if (!user || user.password_hash !== User.hashPassword(password))
      return res.status(401).json({ error: "Usuário ou senha inválidos" });
    return res.json(user.toPublic());
  }
}

module.exports = UserController;
