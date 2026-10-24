const express = require("express");
const router = express.Router();
const SettingsController = require("../controllers/settingsController");

router.get("/:userId", SettingsController.get);
router.put("/:userId", SettingsController.upsert);

module.exports = router;
