const mongoose = require("mongoose");
const Lead = require("../models/lead");
const TeamUser = require("../models/TeamUser");
const FollowUp = require("../models/FollowUp");

const validId = (id) => mongoose.Types.ObjectId.isValid(id);

// 1. GET ALL LEADS
exports.getLeads = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = 10;
    const skip = (page - 1) * limit;

    const { search, status, sortBy, sortOrder } = req.query;

    const filter = {};

    if (search && search.trim()) {
      const searchValue = search.trim();

      filter.$or = [
        { name: { $regex: searchValue, $options: "i" } },
        { email: { $regex: searchValue, $options: "i" } },
        { company: { $regex: searchValue, $options: "i" } },
      ];
    }

    if (status && status.trim()) {
      filter.status = status.trim();
    }

    const allowedSortFields = ["createdAt", "name"];

    const selectedSortField = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const selectedSortOrder = sortOrder === "asc" ? 1 : -1;

    const totalLeads = await Lead.countDocuments(filter);
    const totalPages = Math.ceil(totalLeads / limit);

    const leads = await Lead.find(filter)
      .populate("assignedEmployee", "name email role")
      .sort({
        [selectedSortField]: selectedSortOrder,
        _id: -1,
      })
      .skip(skip)
      .limit(limit)
      .lean();

      // fetch all follow-up 
   // Fetch all follow-ups for each lead
const leadsWithFollowUps = await Promise.all(
  leads.map(async (lead) => {
    const followUps = await FollowUp.find({
      lead: lead._id,
    })
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email")
      .sort({ dueDate: 1, createdAt: 1 })
      .lean();

    return {
      ...lead,
      followUps,
    };
  })
);

    return res.status(200).json({
      success: true,
      count: leadsWithFollowUps.length,
      leads:leadsWithFollowUps,
      pagination: {
        currentPage: page,
        totalPage: totalPages,
        totalPages,
        totalLeads,
        totalItems: totalLeads,
        limit,
      },
    });
  } catch (error) {
    console.error("Get leads error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load leads.",
    });
  }
};

// 2. CREATE LEAD
exports.createLead = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      status,
      source,
      assignedEmployee,
      followUpDate,
      followUpNote,
      priority,
      followUps,
    } = req.body;

    if (!name || !name.trim() || !email || !email.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Name and email are required." });
    }
    const formattedStatus = status
      ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
      : "New";

    let validAssignee = null;
    if (assignedEmployee && mongoose.Types.ObjectId.isValid(assignedEmployee)) {
      validAssignee = assignedEmployee;
    } else if (req.user && req.user.id) {
      validAssignee = req.user.id;
    }

    const lead = await Lead.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || "",
      company: company?.trim() || "",
      status: formattedStatus,
      source: source || "Website",
      assignedEmployee: validAssignee,
      followUpDate: followUpDate || null,
      priority: priority || "Medium",
      followUpNote: followUpNote || "",
      followUpStatus: "Pending",
      createdBy: req.user ? req.user.id || req.user._id : null,
    });

    if (Array.isArray(followUps) && followUps.length > 0) {
      const followUpDocs = followUps
        .filter((fu) => fu.title && fu.dueDate)
        .map((fu) => ({
          lead: lead._id,
          leadId: lead._id,
          title: fu.title,
          type: fu.type || "call",
          dueDate: new Date(fu.dueDate),
          priority: fu.priority || "medium",
          notes: fu.notes || "",
          assignedTo: validAssignee,
          createdBy: req.user ? req.user.id || req.user._id : null,
          status: "pending",
        }));

      if (followUpDocs.length > 0) {
        await FollowUp.insertMany(followUpDocs);
      }
    }

    return res
      .status(201)
      .json({ success: true, message: "Lead created successfully.", lead });
  } catch (error) {
    console.error("Create lead error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create lead.",
    });
  }
};

// 3. UPDATE LEAD

// 3. UPDATE LEAD + PRESERVE MULTIPLE FOLLOW-UPS
exports.updateLead = async (req, res) => {
  try {
    const leadId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(leadId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID."
      });
    }

    const { followUps, ...leadData } = req.body;

    if (leadData.priority) {
      const p = String(leadData.priority).toLowerCase();
      leadData.priority = p.charAt(0).toUpperCase() + p.slice(1);
    }

    const lead = await Lead.findByIdAndUpdate(
      leadId,
      { $set: leadData },
      { new: true, runValidators: true }
    );

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found."
      });
    }

    let savedFollowUps = [];

    if (Array.isArray(followUps)) {
      for (const fu of followUps) {
        if (!fu.title || !fu.dueDate) continue;

        const dueDate = new Date(fu.dueDate);

        if (Number.isNaN(dueDate.getTime())) {
          continue;
        }

        const followUpData = {
          lead: lead._id,
          leadId: lead._id,
          title: fu.title.trim(),
          type: fu.type || "call",
          dueDate,
          priority: String(fu.priority || "medium").toLowerCase(),
          notes: fu.notes || "",
          assignedTo:
            fu.assignedTo ||
            lead.assignedEmployee ||
            req.user.id,
        };

        let saved;

        // Existing Follow-up: update the same document
        if (
          fu._id &&
          mongoose.Types.ObjectId.isValid(fu._id)
        ) {
          saved = await FollowUp.findOneAndUpdate(
            {
              _id: fu._id,
              lead: lead._id
            },
            { $set: followUpData },
            { new: true, runValidators: true }
          );
        }

        // New Follow-up: create a separate document
        if (!saved) {
          saved = await FollowUp.create({
            ...followUpData,
            createdBy: req.user.id,
            status: "pending"
          });
        }

        savedFollowUps.push(saved);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Lead and follow-ups updated successfully.",
      lead,
      followUps: savedFollowUps
    });

  } catch (error) {
    console.error("Update Lead Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update lead."
    });
  }
};





// 4. TRANSITION LEAD STATUS
exports.transitionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!validId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid lead ID." });
    }

    const lead = await Lead.findById(id);
    if (!lead) {
      return res
        .status(404)
        .json({ success: false, message: "Lead not found." });
    }

    lead.status = status;
    await lead.save();

    return res
      .status(200)
      .json({ success: true, message: "Lead status updated.", lead });
  } catch (error) {
    console.error("Transition status error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to change lead status." });
    }
};

// 5. DELETE LEAD
exports.deleteLead = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid lead ID." });
    }

    const lead = await Lead.findById(id);
    if (!lead) {
      return res
        .status(404)
        .json({ success: false, message: "Lead not found." });
    }

    // await FollowUp.deleteMany({ lead: id });
    await lead.deleteOne();

    return res
      .status(200)
      .json({ success: true, message: "Lead deleted successfully." });
  } catch (error) {
    console.error("Delete lead error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete lead." });
  }
};

// 6. GET FOLLOW UPS (Fully Mapped for Frontend Table)

exports.getFollowUps = async (req, res) => {
  try {
    const allFollowUps = await FollowUp.find({})
      .populate("lead", "name email phone company")
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email")
      .sort({ dueDate: 1, createdAt: -1 })
      .lean();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const followUps = allFollowUps.map((fu) => {
      const lead = fu.lead || {};

      return {
        ...fu,
        leadId: fu.lead?._id || fu.leadId,
        leadName: lead.name || "N/A",
        name: lead.name || "N/A",
        phone: lead.phone || "N/A",
        company: lead.company || "",
        status: String(fu.status || "pending").toLowerCase(),
      };
    });

    const pending = followUps.filter(
      (fu) => fu.status === "pending"
    );

    const completed = followUps.filter(
      (fu) => fu.status === "completed"
    );

    const cancelled = followUps.filter(
      (fu) => fu.status === "cancelled"
    );

    const upcoming = pending.filter(
      (fu) => fu.dueDate && new Date(fu.dueDate) >= today
    );

    const overdue = pending.filter(
      (fu) => fu.dueDate && new Date(fu.dueDate) < today
    );

    return res.status(200).json({
      success: true,
      count: followUps.length,
      followUps,
      pending,
      completed,
      cancelled,
      upcoming,
      overdue,
      summary: {
        all: followUps.length,
        pending: pending.length,
        completed: completed.length,
        cancelled: cancelled.length,
        upcoming: upcoming.length,
        overdue: overdue.length,
      },
    });
  } catch (error) {
    console.error("Get follow-ups error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load follow-ups.",
    });
  }
};
// 7. UPDATE FOLLOW-UP STATUS
// 7. UPDATE FOLLOW-UP STATUS
exports.updateFollowUpStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const requestedStatus =
      req.body.followUpStatus || req.body.status || "completed";

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid follow-up ID.",
      });
    }

    const normalizedStatus = String(requestedStatus).toLowerCase();

    const allowedStatuses = [
      "pending",
      "completed",
      "cancelled",
    ];

    if (!allowedStatuses.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid follow-up status.",
      });
    }

    const updateData = {
      status: normalizedStatus,
    };

    if (normalizedStatus === "completed") {
      updateData.completedAt = new Date();
    } else {
      updateData.completedAt = null;
    }

    const followUp = await FollowUp.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: "Follow-up not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Follow-up status updated successfully.",
      followUp,
    });
  } catch (error) {
    console.error("Update follow-up status error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update follow-up status.",
    });
  }
};

// 8. CREATE LEAD WITH FOLLOW UPS
exports.createLeadWithFollowUps = async (req, res) => {
  try {
    const { name, email, company, status, priority, followUps } = req.body;

    const lead = await Lead.create({
      name,
      email,
      company,
      status,
      priority,
      assignedEmployee: req.user.id,
    });

    let createdFollowUps = [];
    if (Array.isArray(followUps) && followUps.length > 0) {
      const followUpDocs = followUps
        .filter((fu) => fu.title && fu.dueDate)
        .map((fu) => ({
          lead: lead._id,
          leadId: lead._id,
          title: fu.title,
          type: fu.type || "call",
          dueDate: new Date(fu.dueDate),
          assignedTo: req.user.id,
          createdBy: req.user.id,
          status: "pending",
        }));

      if (followUpDocs.length > 0) {
        createdFollowUps = await FollowUp.insertMany(followUpDocs);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Lead and follow-ups created successfully.",
      lead,
      followUps: createdFollowUps,
    });
  } catch (error) {
    console.error("Error creating lead with follow-ups:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};