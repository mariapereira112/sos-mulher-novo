const express = require("express");
const router = express.Router();
const UserController = require("../controllers/userController");

router.post("/", UserController.create);
router.post("/login", UserController.login);
router.get("/:userId", UserController.getById);
router.patch("/:userId", UserController.update);
router.post("/:userId/complete-onboarding", UserController.completeOnboarding);

module.exports = router;
