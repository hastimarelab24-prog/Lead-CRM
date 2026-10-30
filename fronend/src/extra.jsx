// 6. GET ALL FOLLOW-UPS FROM FOLLOWUP COLLECTION
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