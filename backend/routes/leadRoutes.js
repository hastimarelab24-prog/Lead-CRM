const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const Lead = require("../models/lead");
const FollowUp = require("../models/FollowUp");
const User = require("../models/TeamUser");
const verifyToken = require("../middleware/authMiddleware");

const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

// Import controller functions safely (fallback to empty functions if undefined)
// Import controller functions safely
const leadController = require("../controllers/leadController");

const {
  getLeads = (req, res) => res.status(501).json({ message: "Not implemented" }),
  createLead = (req, res) => res.status(501).json({ message: "Not implemented" }),
  updateLead,
  updatedLead = updateLead || leadController.updateLead || ((req, res) => res.status(501).json({ message: "Not implemented" })),
  transitionStatus = (req, res) => res.status(501).json({ message: "Not implemented" }),
  deleteLead = (req, res) => res.status(501).json({ message: "Not implemented" }),
  getFollowUps = (req, res) => res.status(501).json({ message: "Not implemented" }),
  updateFollowUpStatus = (req, res) => res.status(501).json({ message: "Not implemented" }),
} = leadController;
const logActive = require("../utils/auditLogger");

// Require login for all lead routes.
router.use(authMiddleware);

// 
// 1. SPECIFIC / STATIC ROUTES FIRST (IMPORTANT)
// 
router.route("/").get(getLeads).post(createLead);
router.get("/follow-ups/all", getFollowUps);
router.put("/follow-ups/:id", updateFollowUpStatus);

router.delete("/follow-ups/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID.",
      });
    }

    const lead = await Lead.findById(id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found.",
      });
    }

    // Clear only follow-up fields. Keep the Lead document.
    lead.followUpDate = null;
    lead.followUpTime = "";
    lead.followUpNote = "";
    lead.followUpStatus = "Pending";
    lead.priority = "Medium";

    await lead.save();

    return res.status(200).json({
      success: true,
      message: "Follow-up removed successfully.",
      lead,
    });
  } catch (error) {
    console.error("Delete follow-up error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove follow-up.",
    });
  }
});

// 
// 2. ASSIGN & STATUS PATCH ROUTES
// 
router.patch(
  "/:id/assign",
  allowRoles("administrator", "manager"),
  async (req, res) => {
    try {
      const { employeeId } = req.body;
      const { id } = req.params;

      if (
        !mongoose.isValidObjectId(id) ||
        !mongoose.isValidObjectId(employeeId)
      ) {
        return res.status(400).json({
          message: "Invalid lead ID or employee ID.",
        });
      }

      const employee = await User.findOne({
        _id: employeeId,
        $or: [
          { isActive: true },
          { iactive: true },
          { isActive: { $exists: false } }
        ]
      });

      if (!employee) {
        return res.status(400).json({
          message: "Select an active employee.",
        });
      }

      const lead = await Lead.findById(id);

      if (!lead) {
        return res.status(404).json({
          message: "Lead not found.",
        });
      }

      const previousEmployee = lead.assignedEmployee?.toString() || null;
      lead.assignedEmployee = employee._id;

      await lead.save();
      
      try {
        if (logActive) {
          await logActive(
            req.user.id || req.user._id,
            "LEAD_ASSIGNED",
            "Lead",
            lead._id.toString(),
            {
              previousEmployee,
              newEmployee: employee._id.toString(),
            }
          );
        }
      } catch (auditError) {
        console.error("Audit log error:", auditError);
      }

      return res.status(200).json({
        message: "Lead assigned successfully.",
        lead,
      });
    } catch (error) {
      console.error("Assign lead error:", error);
      return res.status(500).json({
        message: "Failed to assign lead.",
        error: error.message,
      });
    }
  }
);

router.patch("/:id/status", transitionStatus);

// 
// 3. DYNAMIC /:id ROUTES LAST
// 
router.route("/:id").put(updatedLead).delete(deleteLead);

module.exports = router;