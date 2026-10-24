const Alert   = require("../models/Alert");
const Contact = require("../models/Contact");

class AlertController {
  static async create(req, res) {
    try {
      const { userId, latitude, longitude } = req.body;
      if (!userId) return res.status(400).json({ error: "userId obrigatório" });

      const alert    = await Alert.create({ user_id: userId, latitude, longitude, status: "sms_sent" });
      const contacts = await Contact.findAll({ where: { user_id: userId } });

      return res.status(201).json({
        ...alert.toJSON(),
        contacts: contacts.map(c => c.toJSON()),
        message: `Alerta enviado para ${contacts.length} contato(s)`,
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async listByUser(req, res) {
    const alerts = await Alert.findAll({ where: { user_id: req.params.userId }, order: [["created_at", "DESC"]] });
    return res.json(alerts);
  }

  static async resolve(req, res) {
    const alert = await Alert.findByPk(req.params.alertId);
    if (!alert) return res.status(404).json({ error: "Alerta não encontrado" });
    await alert.update({ status: "resolved", resolved_at: new Date() });
    return res.json(alert);
  }

  static async updateStatus(req, res) {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "status obrigatório" });
    const alert = await Alert.findByPk(req.params.alertId);
    if (!alert) return res.status(404).json({ error: "Alerta não encontrado" });
    await alert.update({ status });
    return res.json(alert);
  }
}

module.exports = AlertController;
