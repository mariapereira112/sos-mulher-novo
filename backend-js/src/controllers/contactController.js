const Contact = require("../models/Contact");

class ContactController {
  static async create(req, res) {
    try {
      const { userId, name, phone, relationship } = req.body;
      if (!userId || !name || !phone)
        return res.status(400).json({ error: "Campos obrigatórios: userId, name, phone" });
      const contact = await Contact.create({ user_id: userId, name, phone, relationship });
      return res.status(201).json(contact);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async listByUser(req, res) {
    const contacts = await Contact.findAll({ where: { user_id: req.params.userId } });
    return res.json(contacts);
  }

  static async delete(req, res) {
    const contact = await Contact.findByPk(req.params.contactId);
    if (!contact) return res.status(404).json({ error: "Contato não encontrado" });
    await contact.destroy();
    return res.status(204).send();
  }
}

module.exports = ContactController;
