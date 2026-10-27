
// const express = require("express");
// const mongoose = require("mongoose");

// const router = express.Router();

// const authMiddleware = require("../middleware/authMiddleware");
// const Lead = require("../models/lead");
// const AuthUser = require("../models/AuthUser");
// const TeamUser = require("../models/TeamUser");

// // All dashboard APIs require authentication
// router.use(authMiddleware);

// // GET /api/dashboard/overview
// router.get("/overview", async (req, res) => {
//   try {
//     const userId = req.user.id || req.user._id;
//     const userRole = String(req.user.role || "").toLowerCase();

//     const leadFilter = {};

//     // Employees see only their assigned leads
//     if (userRole === "employee") {
//       if (!mongoose.isValidObjectId(userId)) {
//         return res.status(401).json({
//           success: false,
//           message: "Invalid authenticated user.",
//         });
//       }

//       leadFilter.assignedEmployee = userId;
//     }

//     const [
//       totalLeads,
//       convertedLeads,
//       recentLeads,
//       statusCounts,
//       teamUsers,
//     ] = await Promise.all([
//       Lead.countDocuments(leadFilter),

//       Lead.countDocuments({
//         ...leadFilter,
//         status: "won",
//       }),

//       Lead.find(leadFilter)
//         .sort({ createdAt: -1 })
//         .limit(5)
//         .populate("assignedEmployee", "name email")
//         .lean(),

//       Lead.aggregate([
//         { $match: leadFilter },
//         {
//           $group: {
//             _id: "$status",
//             count: { $sum: 1 },
//           },
//         },
//       ]),

//       userRole === "administrator" || userRole === "manager"
//         ? TeamUser.find({
//             role: "employee",
//             isActive: { $ne: false },
//           })
//             .select("name email")
//             .lean()
//         : Promise.resolve([]),
//     ]);

//     const leadStatus = statusCounts.map((item) => ({
//       status: item._id,
//       count: item.count,
//     }));

//     const teamPerformance = await Promise.all(
//       teamUsers.map(async (employee) => {
//         const assignedCount = await Lead.countDocuments({
//           assignedEmployee: employee._id,
//         });

//         const wonCount = await Lead.countDocuments({
//           assignedEmployee: employee._id,
//           status: "won",
//         });

//         return {
//           _id: employee._id,
//           name: employee.name,
//           email: employee.email,
//           totalLeads: assignedCount,
//           convertedLeads: wonCount,
//         };
//       })
//     );

//     return res.status(200).json({
//       success: true,
//       totalLeads,
//       convertedLeads,
//       recentLeads,
//       leadStatus,
//       teamPerformance,
//       followUpsToday: [],
//       recentActivities: [],
//     });
//   } catch (error) {
//     console.error("Dashboard overview error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to load dashboard overview.",
//     });
//   }
// });

// // GET /api/dashboard/profile
// router.get("/profile", async (req, res) => {
//   try {
//     const userId = req.user.id || req.user._id;

//     const user = await AuthUser.findById(userId)
//       .select("-password")
//       .lean();

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found.",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       user,
//     });
//   } catch (error) {
//     console.error("Dashboard profile error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to load profile.",
//     });
//   }
// });

// // GET /api/dashboard/stats
// router.get("/stats", async (req, res) => {
//   try {
//     const userId = req.user.id || req.user._id;
//     const userRole = String(req.user.role || "").toLowerCase();

//     const filter = {};

//     if (userRole === "employee") {
//       filter.assignedEmployee = userId;
//     }

//     const [totalLeads, convertedLeads] = await Promise.all([
//       Lead.countDocuments(filter),
//       Lead.countDocuments({ ...filter, status: "won" }),
//     ]);

//     return res.status(200).json({
//       success: true,
//       totalLeads,
//       convertedLeads,
//     });
//   } catch (error) {
//     console.error("Dashboard stats error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to load dashboard stats.",
//     });
//   }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getDashboardData,
  exportLeadsCSV
} = require('../controllers/dashboardController');

router.get('/', getDashboardData);
router.get('/stats',getDashboardData)
router.get('/export-csv', exportLeadsCSV);

module.exports = router;