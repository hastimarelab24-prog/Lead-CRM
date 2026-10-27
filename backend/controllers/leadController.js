const mongoose = require("mongoose");
const Lead = require("../models/lead");
const TeamUser = require("../models/TeamUser");

const validId = (id) => mongoose.Types.ObjectId.isValid(id);

// 1. GET ALL LEADS
exports.getLeads = async (req, res) => {
  try {
    let filter = {};
    const { search, status } = req.query;

    if (search && search.trim() !== "") {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
      ];
    }

    if (status && status.trim() !== "") {
      filter.status = status;
    }

    const leads = await Lead.find(filter)
      .populate("assignedEmployee", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: leads.length,
      leads,
    });
  } catch (error) {
    console.error("Get leads error:", error);
    return res
      .status(500)
      .json({
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

    return res
      .status(201)
      .json({ success: true, message: "Lead created successfully.", lead });
  } catch (error) {
    console.error("Create lead error:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: error.message || "Failed to create lead.",
      });
  }
};

// 3. UPDATE LEAD
exports.updatedLead = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid lead ID." });
    }

    const lead = await Lead.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!lead) {
      return res
        .status(404)
        .json({ success: false, message: "Lead not found." });
    }

    return res
      .status(200)
      .json({ success: true, message: "Lead updated successfully.", lead });
  } catch (error) {
    console.error("Update lead error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update lead." });
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

// Follow-up get (Fixed .sort() and spelling)
exports.getFollowUps = async (req, res) => {
  try {
    const followUps = await Lead.find({})
      .populate("assignedEmployee", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pendingList = followUps.filter(
      (item) => item.followUpStatus !== "Completed",
    );
    const completedList = followUps.filter(
      (item) => item.followUpStatus === "Completed",
    );

    const upcoming = pendingList.filter(
      (item) => item.followUpDate && new Date(item.followUpDate) >= today,
    );
    const overdue = pendingList.filter(
      (item) => item.followUpDate && new Date(item.followUpDate) < today,
    );

    return res.status(200).json({
      success: true,
      pending: pendingList,
      completed: completedList, // સ્પેલિંગ પણ કમ્પ્લીટ કરી દીધો છે
      upcoming,
      overdue,
    });
  } catch (err) {
    console.error("get follow-ups error", err);
    return res
      .status(500)
      .json({ success: false, message: "failed to load follow-ups" });
  }
};

// Follow-up status update
// Follow-up status update
exports.updateFollowUpStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { followUpStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid lead ID." });
    }

    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found." });
    }

    // સ્ટેટસ કમ્પ્લીટ કરો
    lead.followUpStatus = followUpStatus || "Completed";
    await lead.save();

    return res.status(200).json({ 
      success: true, 
      message: "Follow-up status updated successfully", 
      lead 
    });
  } catch (err) {
    console.error("Update follow-up status error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};