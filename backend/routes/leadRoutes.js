const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const Lead = require("../models/lead");
const User = require("../models/TeamUser");

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
// folow-up spefific router 
router.get("/follow-ups/all",getFollowUps);
router.put("/follow-ups/:id", updateFollowUpStatus);
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