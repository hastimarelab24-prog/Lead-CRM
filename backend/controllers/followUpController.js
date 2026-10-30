const mongoose = require("mongoose");
const FollowUp = require("../models/FollowUp");
const Lead = require("../models/lead");
const User = require("../models/TeamUser");
const auditLogger = require("../utils/auditLogger");

const validId = (id) => mongoose.Types.ObjectId.isValid(id);

// check lead access
async function getAccessibleLead(req, leadId) {
  if (!validId(leadId)) return null;

  const lead = await Lead.findById(leadId).select("_id name assignedEmployee");

  if (!lead) return null;

  const role = req.user.role;

  if (role === "administrator") return lead;

  if (role === "employee") {
    return String(lead.assignedEmployee) === req.user.id ? lead : null;
  }

  if (role === "manager") {
    const assigned = await User.findById(lead.assignedEmployee)
      .select("manager")
      .lean();

    if (
      String(lead.assignedEmployee) === req.user.id ||
      String(assigned?.manager || "") === req.user.id
    ) {
      return lead;
    }

    return null;
  }

  return null;
}

// CHECK FOLLOW-UP ACCESS
async function canAccessFollowUp(req, followUp) {
  if (req.user.role === "administrator") {
    return true;
  }

  const leadId = followUp.lead?._id || followUp.lead;

  const lead = await getAccessibleLead(req, leadId);

  if (!lead) return false;

  if (req.user.role === "employee") {
    return String(followUp.assignedTo) === String(req.user.id);
  }

  if (req.user.role === "manager") {
    const assignee = await User.findById(followUp.assignedTo)
      .select("manager")
      .lean();

    return (
      String(followUp.assignedTo) === String(req.user.id) ||
      String(assignee?.manager || "") === String(req.user.id)
    );
  }

  return false;
}

// async function getAssignee(req, assignedTo) {
//   const targetId = assignedTo || req.user.id;
//   if (!validId(targetId)) return null;

//   const target = await User.findById(targetId)
//     .select("_id role manager isActive")
//     .lean();

//   if (!target || target.isActive === false) return null;

//   if (req.user.role === "administrator") return target;

//   if (req.user.role === "employee") {
//     return String(target._id) === req.user.id ? target : null;
//   }

//   if (req.user.role === "manager") {
//     if (String(target._id) === req.user.id) return target;
//     if (
//       target.role === "employee" &&
//       String(target.manager || "") === req.user.id
//     ) {
//       return target;
//     }
//   }

//   return null;
// }

// Example fix for fetching users/employees in your backend route or controller

exports.getAssignees = async (req, res) => {
  try {
    // Relax the filter to ensure users are returned even if isActive is missing or false
    // const users = await User.find({
    //   $or: [
    //     { isActive: true },
    //     { isActive: { $exists: false } },
    //     { iactive: true },
    //   ],
    // })
    const users=await User.find({})
      .select("_id name email role isActive")
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({ success: true, users ,assignees:users});
  } catch (error) {
    console.error("Error fetching users:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to load team members." });
  }
};

// POST /api/follow-ups
exports.createFollowUp = async (req, res) => {
  try {
    const leadId = req.body.leadId || req.body.lead;
    const {
      
      title,
      type,
      dueDate,
      priority,
      notes,
      assignedTo,
      activityType,
      reminderAt,
    } = req.body;

    if (!leadId || !title || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "Lead, title and due date are required.",
      });
    }

    // if (!["call", "email", "meeting", "task", "other"].includes(type || "call")) {
    //   return res.status(400).json({ message: "Invalid follow-up type." });
    // }

    // if (!["low", "medium", "high", "urgent"].includes(priority || "medium")) {
    //   return res.status(400).json({ message: "Invalid priority." });
    // }

    // const parsedDate = new Date(dueDate);
    // if (Number.isNaN(parsedDate.getTime())) {
    //   return res.status(400).json({ message: "Invalid due date." });
    // }

    // const accessibleLead = await getAccessibleLead(req, lead);
    // if (!accessibleLead) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "Lead not found or access denied.",
    //   });
    // }

    // const assignee = await getAssignee(req, assignedTo);
    // if (!assignee) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "You cannot assign this follow-up to that user.",
    //   });
    // }
const parsedDate = new Date(dueDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid due date format.",
      });
    }

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Selected lead record does not exist in the database.",
      });
    }

    const followUp = await FollowUp.create({
      lead: leadId,
      leadId: leadId,
      assignedTo: assignedTo || req.user.id,
      createdBy: req.user.id,
      title: title.trim() || "Scheduled Follow-up",
      activityType: activityType || "email",
      dueDate: parsedDate,
      priority: priority || "medium",
      type: type || "call",
      notes: notes ? notes.trim() : "",
      reminderAt: reminderAt ? new Date(reminderAt) : null,
      status: "pending",
    });

    // await auditLogger({
    //   actor: req.user.id,
    //   action: "FOLLOW_UP_CREATED",
    //   entity: "FollowUp",
    //   entityId: followUp._id,
    //   details: { lead: String(lead), assignedTo: String(assignee._id) },
    // });

    // await Notification.create({
    //   recipient: assignee._id,
    //   followUp: followUp._id,
    //   message: `Follow-up scheduled: ${followUp.title}`,
    //   type: "follow_up_due",
    //   dueDate: followUp.dueDate,
    // });

    return res.status(201).json({
      success: true,
      message: "Follow-up created successfully.",
      followUp,
    });
  } catch (error) {
    console.error("Create follow-up:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create follow-up.",
    });
  }
};

// GET /api/follow-ups?view=upcoming|overdue|completed

// GET ALL FOLLOW-UPS
exports.getFollowUps = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      filter.status = new RegExp(
        `^${req.query.status}$`,
        "i"
      );
    }

    const now = new Date();

    if (req.query.view === "upcoming") {
      filter.status = "pending";
      filter.dueDate = { $gte: now };
    }

    if (req.query.view === "overdue") {
      filter.status = "pending";
      filter.dueDate = { $lt: now };
    }

    if (req.query.view === "completed") {
      filter.status = "completed";
    }

    let followUps = await FollowUp.find(filter)
      .populate("lead", "name email phone company assignedEmployee")
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email")
      .sort({ dueDate: 1, createdAt: -1 })
      .lean();

    // Apply lead access permissions
    if (req.user.role !== "administrator") {
      const permitted = [];

      for (const item of followUps) {
        const leadId = item.lead?._id || item.lead;

        const accessibleLead = await getAccessibleLead(
          req,
          leadId
        );

        if (accessibleLead) {
          permitted.push(item);
        }
      }

      followUps = permitted;
    }

    const pending = followUps.filter(
      item => item.status?.toLowerCase() === "pending"
    );

    const completed = followUps.filter(
      item => item.status?.toLowerCase() === "completed"
    );

    const cancelled = followUps.filter(
      item => item.status?.toLowerCase() === "cancelled"
    );

    const overdue = pending.filter(
      item => item.dueDate && new Date(item.dueDate) < now
    );

    const upcoming = pending.filter(
      item => item.dueDate && new Date(item.dueDate) >= now
    );

    return res.status(200).json({
      success: true,
      followUps,
      pending,
      completed,
      cancelled,
      overdue,
      upcoming,
      counts: {
        all: followUps.length,
        pending: pending.length,
        completed: completed.length,
        cancelled: cancelled.length,
        overdue: overdue.length
      }
    });

  } catch (error) {
    console.error("Get Follow-ups Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load follow-ups."
    });
  }
};




// PATCH /api/follow-ups/:id
exports.updateFollowUp = async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ message: "Invalid follow-up ID." });
    }

    const followUp = await FollowUp.findById(req.params.id);
    if (!followUp || !(await canAccessFollowUp(req, followUp))) {
      return res.status(404).json({
        message: "Follow-up not found or access denied.",
      });
    }

    const allowedFields = [
      "title",
      "type",
      "dueDate",
      "priority",
      "notes",
      "assignedTo",
    ];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === "assignedTo") {
          const assignee = await getAssignee(req, req.body.assignedTo);
          if (!assignee) {
            return res.status(403).json({ message: "Invalid assignee." });
          }
          followUp.assignedTo = assignee._id;
        } else {
          followUp[field] = req.body[field];
        }
      }
    }

    await followUp.save();

    await auditLogger({
      actor: req.user.id,
      action: "FOLLOW_UP_UPDATED",
      entity: "FollowUp",
      entityId: followUp._id,
      details: { fields: Object.keys(req.body) },
    });

    return res.json({ success: true, followUp });
  } catch (error) {
    console.error("Update follow-up:", error);
    return res.status(500).json({ message: "Failed to update follow-up." });
  }
};

// PATCH /api/follow-ups/:id/complete

// PATCH /api/follow-ups/:id/complete
exports.completeFollowUp = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid follow-up ID."
      });
    }

    const followUp = await FollowUp.findById(id);

    if (
      !followUp ||
      !(await canAccessFollowUp(req, followUp))
    ) {
      return res.status(404).json({
        success: false,
        message: "Follow-up not found or access denied."
      });
    }

    if (followUp.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cancelled follow-up cannot be completed."
      });
    }

    followUp.status = "completed";
    followUp.completedAt = new Date();

    await followUp.save();

    return res.status(200).json({
      success: true,
      message: "Follow-up completed successfully.",
      followUp
    });

  } catch (error) {
    console.error("Complete Follow-up Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// DELETE /api/follow-ups/:id
exports.deleteFollowUp = async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ message: "Invalid follow-up ID." });
    }

    const followUp = await FollowUp.findById(req.params.id);

    if (!followUp || !(await canAccessFollowUp(req, followUp))) {
      return res.status(404).json({
        message: "Follow-up not found or access denied.",
      });
    }
    if (followUp.status === "completed") {
      return res.status(400).json({
        messange: "complated follow-up cannot be cancelled",
      });
    }
    // followUp.status = "cancelled";
    // await followUp.save()
    // await  auditLogger({
    //   actor:req.user.id,action:"FOLLOW_UP_CANCELLED",entity:"Followup",entitiId:followUp._id,
    // })
    // return res.json({
    //   success:true,messange:"follow-up cancelled.",followUp,
    // })

    followUp.status = "cancelled";
    await followUp.save();
    await auditLogger({
      actor: req.user.id,
      action: "FOLLOW_UP_DELETED",
      entity: "FollowUp",
      entityId: followUp._id,
    });

    return res.json({
      success: true,
      message: "Follow-up deleted.",
      followUp,
    });
  } catch (error) {
    console.error("Delete follow-up:", error);
    return res.status(500).json({ message: "Failed to delete follow-up." });
  }
};
