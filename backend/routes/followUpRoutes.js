

const express = require("express");
const router = express.Router();

const followUpController = require("../controllers/followUpController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get("/", followUpController.getFollowUps);

router.patch(
  "/:id/complete",
  followUpController.completeFollowUp
);

router.delete(
  "/:id",
  followUpController.deleteFollowUp
);

module.exports = router;
