const express = require("express");
const router = express.Router();
const PostController = require("../controllers/postController");

router.post("/", PostController.create);
router.get("/", PostController.listAll);
router.get("/user/:userId", PostController.listByUser);

module.exports = router;
