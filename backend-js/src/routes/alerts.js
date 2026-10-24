const express = require("express");
const router = express.Router();
const AlertController = require("../controllers/alertController");

router.post("/", AlertController.create);
router.get("/user/:userId", AlertController.listByUser);
router.put("/:alertId/resolve", AlertController.resolve);
router.put("/:alertId/status", AlertController.updateStatus);

module.exports = router;
