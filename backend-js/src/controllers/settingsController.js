const Settings = require("../models/Settings");

class SettingsController {
  static async get(req, res) {
    const settings = await Settings.findOne({ where: { user_id: req.params.userId } });
    if (!settings) return res.status(404).json({ error: "Configurações não encontradas" });
    return res.json(settings);
  }

  static async upsert(req, res) {
    try {
      const user_id = req.params.userId;
      const allowed = ["timer_duration", "fake_call_enabled", "shake_enabled"];
      const patch   = {};
      allowed.forEach(k => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });
      const [settings] = await Settings.upsert({ user_id, ...patch });
      return res.json(settings);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
}

module.exports = SettingsController;
