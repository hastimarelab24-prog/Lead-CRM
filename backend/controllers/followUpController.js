const mongoose = require("mongoose");
const FollowUp = require("../models/FollowUp");
const Lead = require("../models/lead");
const User = require("../models/TeamUser");
const Notification = require("../models/Notification");
const auditLogger = require("../utils/auditLogger");

const validId = (id) => mongoose.Types.ObjectId.isValid(id);

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

async function canAccessFollowUp(req, followUp) {
  if (req.user.role === "administrator") return true;

  const lead = await getAccessibleLead(req, followUp.lead);
  if (!lead) return false;

  if (req.user.role === "employee") {
    return String(followUp.assignedTo) === req.user.id;
  }

  if (req.user.role === "manager") {
    const assignee = await User.findById(followUp.assignedTo)
      .select("manager")
      .lean();

    return (
      String(followUp.assignedTo) === req.user.id ||
      String(assignee?.manager || "") === req.user.id
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
    const users = await User.find({
      $or: [
        { isActive: true },
        { isActive: { $exists: false } },
        { iactive: true },
      ],
    })
      .select("_id name email role isActive")
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({ success: true, users });
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
exports.getFollowUps = async (req, res) => {
  try {
    // const role = req.user.role;
    const filter = {};

    // if (role === "employee") {
    //   filter.assignedTo = req.user.id;
    // } else if (role === "manager") {
    //   const team = await User.find({
    //     $or: [{ _id: req.user.id }, { manager: req.user.id }],
    //     isActive: { $ne: false },
    //   }).select("_id");

    //   filter.assignedTo = { $in: team.map((u) => u._id) };
    // }

    if (req.query.status && req.query.status.trim() !== "") {
      // if (!["pending", "completed", "cancelled"].includes(req.query.status)) {
      //   return res.status(400).json({ message: "Invalid status filter." });
      // }
      filter.status = new RefExp(`^${req.query.status}$`,"i");
    }

    const now = new Date();

    if (req.query.view === "upcoming") {
      filter.status = "pending";
      filter.dueDate = { $gte: now };
    } else if (req.query.view === "overdue") {
      filter.status = "pending";
      filter.dueDate = { $lt: now };
    } else if (req.query.view === "completed") {
      filter.status = "completed";
    } 
    // else if (req.query.view && req.query.view !== "all") {
    //   return res.status(400).json({ message: "Invalid view filter." });
    // }

    // Also enforce lead-level permissions for non-admin users.
    let followUps = await FollowUp.find(filter)
      .populate("lead", "name company email assignedEmployee")
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email")
      .sort({ dueDate: 1 })
      .lean();

    // if (role !== "administrator") {
    //   followUps = followUps.filter(async () => true);
    //   const permitted = [];

    //   for (const item of followUps) {
    //     const allowed = await getAccessibleLead(req, item.lead?._id);
    //     if (allowed) permitted.push(item);
    //   }

    //   followUps = permitted;
    // }

    return res.json({ success: true, followUps });
  } catch (error) {
    console.error("Get follow-ups:", error);
    return res.status(500).json({ message: "Failed to load follow-ups." });
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
exports.completeFollowUp = async (req, res) => {
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

    if (followUp.status === "cancelled") {
      return res.status(400).json({
        message: "Cancelled follow-ups cannot be completed.",
      });
    }

    followUp.status = "completed";
    followUp.completedAt = new Date();
    await followUp.save();

    await auditLogger({
      actor: req.user.id,
      action: "FOLLOW_UP_COMPLETED",
      entity: "FollowUp",
      entityId: followUp._id,
    });

    return res.json({
      success: true,
      message: "Follow-up completed.",
      followUp,
    });
  } catch (error) {
    console.error("Complete follow-up:", error);
    return res.status(500).json({ message: "Failed to complete follow-up." });
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
