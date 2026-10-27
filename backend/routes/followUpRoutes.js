
// const express = require("express");
// const mongoose = require("mongoose");

// const router = express.Router();

// const User = require("../models/User");
// const authMiddleware = require("../middleware/authMiddleware");
// const controller = require("../controllers/followUpController");

// router.use(authMiddleware);

// // GET USERS AVAILABLE FOR FOLLOW-UP ASSIGNMENT
// router.get("/assignees", async (req, res) => {
//   try {
//     const currentUser = req.user;

//     if (!currentUser || !currentUser.id) {
//       return res.status(401).json({
//         message: "Authentication required.",
//       });
//     }

//     if (!mongoose.isValidObjectId(currentUser.id)) {
//       return res.status(401).json({
//         message: "Invalid authenticated user.",
//       });
//     }

//     let filter;

//     if (currentUser.role === "administrator") {
//       // Include users where isActive is true or the field is absent.
//       filter = { isActive: { $ne: false } };
//     } else if (
//       currentUser.role === "manager" ||
//       currentUser.role === "employee"
//     ) {
//       // Safe default: non-admin users can assign to themselves only.
//       filter = { _id: currentUser.id };
//     } else {
//       return res.status(403).json({
//         message: "You are not allowed to view assignees.",
//       });
//     }

//     const users = await User.find(filter)
//       .select("_id name email role isActive")
//       .sort({ name: 1 })
//       .lean();

//     return res.status(200).json({ users });
//   } catch (error) {
//     console.error("Fetch assignees error:", error);

//     return res.status(500).json({
//       message: "Failed to load team members.",
//     });
//   }
// });

// // CREATE FOLLOW-UP
// router.post("/", controller.createFollowUp);

// // UPCOMING AND OVERDUE
// router.get("/upcoming", controller.getUpcoming);
// router.get("/overdue", controller.getOverdue);

// // LEAD ACTIVITY HISTORY
// router.get(
//   "/lead/:leadId/history",
//   controller.getLeadActivityHistory
// );

// // LIST FOLLOW-UPS
// router.get("/", controller.getFollowUps);

// // GET SINGLE FOLLOW-UP
// router.get("/:id", controller.getFollowUpById);

// // UPDATE FOLLOW-UP
// router.patch("/:id", controller.updateFollowUp);

// // COMPLETE / CANCEL
// router.patch("/:id/complete", controller.completeFollowUp);
// router.patch("/:id/cancel", controller.cancelFollowUp);

// // SAFE CANCELLATION
// router.delete("/:id", controller.deleteFollowUp);

// module.exports = router;


const express = require("express");
const mongoose = require("mongoose");
const authMiddleware = require("../middleware/authMiddleware");
const controller = require("../controllers/followUpController");
const User = require("../models/TeamUser"); // Ensure this points to your User model correctly

const router = express.Router();

router.use(authMiddleware);

// --- PUT THIS EXACT BLOCK AT THE TOP BEFORE ANY /:id OR OTHER GET ROUTES ---
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

        return res.status(200).json({ success:true,users, assignees:users });
    } catch (error) {
        console.error("Fetch assignees error:", error);
        return res.status(500).json({ message: "Failed to load team members." });
    }
});

// Standard routes follow below
router.get("/", controller.getFollowUps);
router.post("/", controller.createFollowUp);
router.patch("/:id", controller.updateFollowUp);
router.patch("/:id/complete", controller.completeFollowUp);
router.delete("/:id", controller.deleteFollowUp);

module.exports = router;