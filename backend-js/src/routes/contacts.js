const express = require("express");
const router = express.Router();
const ContactController = require("../controllers/contactController");

router.post("/", ContactController.create);
router.get("/:userId", ContactController.listByUser);
router.delete("/:contactId", ContactController.delete);

module.exports = router;
