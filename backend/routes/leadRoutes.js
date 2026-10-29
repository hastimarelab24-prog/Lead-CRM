const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const Lead = require("../models/lead");
const FollowUp = require("../models/FollowUp");
const User = require("../models/TeamUser");
const verifyToken = require("../middleware/authMiddleware");


const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

// Import controller functions correctly
const {
  getLeads,
  createLead,
  updatedLead,
  transitionStatus,
  deleteLead,
  getFollowUps,
  updateFollowUpStatus,
} = require("../controllers/leadController");

const logActive = require("../utils/auditLogger");

// Require login for all lead routes.
router.use(authMiddleware);

// View and create leads
router.route("/").get(getLeads).post(createLead);
// folow-up spefific router // Follow-up specific routes inside leadRoutes.js
router.get("/follow-ups/all", getFollowUps);
router.put("/follow-ups/:id", updateFollowUpStatus);

//  Aa route ahiya add karo (Lead routes ni andar j):

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

// Update and delete a lead
router.route("/:id").put(updatedLead).delete(deleteLead);

// Change lead status
router.patch("/:id/status", transitionStatus);

// Assign a lead to an active employee
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

module.exports = router;