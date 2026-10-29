
router.get(
  "/",
  allowRole("administrator", "manager", "employee"),
  async (req, res) => {
    try {
      // Get all team members
      const users = await User.find()
        .select("-password")
        .sort({ createdAt: -1 })
        .lean();

      // Count leads assigned to each team member
      const leadCounts = await Lead.aggregate([
        {
          $match: {
            assignedEmployee: { $ne: null },
          },
        },
        {
          $group: {
            _id: "$assignedEmployee",
            count: { $sum: 1 },
          },
        },
      ]);

      // Convert counts into a lookup object
      const countMap = new Map(
        leadCounts.map((item) => [
          String(item._id),
          item.count,
        ])
      );

      // Add assignedLeadsCount to each user
      const usersWithLeadCounts = users.map((user) => ({
        ...user,
        assignedLeadsCount: countMap.get(String(user._id)) || 0,
      }));

      return res.status(200).json({
        success: true,
        users: usersWithLeadCounts,
        employees: usersWithLeadCounts,
      });
    } catch (error) {
      console.error("Load users with lead counts error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to load users and assigned lead counts.",
      });
    }
  }
);
