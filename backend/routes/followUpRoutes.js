const express = require("express");
const mongoose = require("mongoose");
const authMiddleware = require("../middleware/authMiddleware");
const controller = require("../controllers/followUpController");
const User = require("../models/TeamUser"); 
const FollowUp = require("../models/FollowUp"); // ✅ Declared once here
const verifyToken = require("../middleware/authMiddleware");
const router = express.Router();

router.use(authMiddleware);

router.get("/assignees", async (req, res) => {
    try {
        const currentUser = req.user;
        if (!currentUser || !currentUser.id) {
            return res.status(401).json({ message: "Authentication required." });
        }

        const users = await User.find({
            $or:[
                {isactive:true},
                {isActive:true},
                {isActive:{$exists:false}},
            ]
        })
            .select("_id name email role isActive")
            .sort({ name: 1 })
            .lean();

        return res.status(200).json({ success: true, users, assignees: users });
    } catch (error) {
        console.error("Fetch assignees error:", error);
        return res.status(500).json({ message: "Failed to load team members." });
    }
});

// Standard routes
router.get("/", controller.getFollowUps);
router.post("/", controller.createFollowUp);
router.patch("/:id", controller.updateFollowUp);
router.patch("/:id/complete", controller.completeFollowUp);

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const deletedFollowUp = await FollowUp.findByIdAndDelete(req.params.id);

    if (!deletedFollowUp) {
      return res.status(404).json({
        message: "Follow-up not found",
      });
    }

    return res.status(200).json({
      message: "Follow-up deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting follow-up:", err);
    return res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;