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