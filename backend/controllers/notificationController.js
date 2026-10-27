
// const mongoose = require("mongoose");
// const Notification = require("../models/Notification");

// exports.getNotifications = async (req, res) => {
//   try {
//     const userId = req.user?.id || req.user?._id;

//     if (!mongoose.isValidObjectId(userId)) {
//       return res.status(401).json({ message: "Please log in again." });
//     }

//     const notifications = await Notification.find({ user: userId })
//       .populate("followUp", "title dueDate status priority")
//       .sort({ createdAt: -1 })
//       .limit(50)
//       .lean();

//     const unreadCount = await Notification.countDocuments({
//       user: userId,
//       isRead: false,
//     });

//     return res.json({ notifications, unreadCount });
//   } catch (error) {
//     console.error("Get notifications error:", error);
//     return res.status(500).json({
//       message: "Unable to load notifications.",
//     });
//   }
// };

// exports.markAsRead = async (req, res) => {
//   try {
//     const userId = req.user?.id || req.user?._id;

//     if (!mongoose.isValidObjectId(req.params.id)) {
//       return res.status(400).json({ message: "Invalid notification ID." });
//     }

//     const notification = await Notification.findOneAndUpdate(
//       { _id: req.params.id, user: userId },
//       { $set: { isRead: true, readAt: new Date() } },
//       { new: true }
//     );

//     if (!notification) {
//       return res.status(404).json({ message: "Notification not found." });
//     }

//     return res.json({ message: "Marked as read.", notification });
//   } catch (error) {
//     console.error("Mark notification read error:", error);
//     return res.status(500).json({
//       message: "Unable to update notification.",
//     });
//   }
// };

// exports.markAllAsRead = async (req, res) => {
//   try {
//     const userId = req.user?.id || req.user?._id;

//     await Notification.updateMany(
//       { user: userId, isRead: false },
//       { $set: { isRead: true, readAt: new Date() } }
//     );

//     return res.json({ message: "All notifications marked as read." });
//   } catch (error) {
//     console.error("Mark all notifications read error:", error);
//     return res.status(500).json({
//       message: "Unable to update notifications.",
//     });
//   }
// };



const Notification = require("../models/Notification");
const mongoose = require("mongoose");
const auditLogger = require("../utils/auditLogger");

// GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user.id,
    })
      .populate("followUp", "title dueDate status priority")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.json({ success: true, notifications });
  } catch (error) {
    console.error("Get notifications:", error);
    return res.status(500).json({ message: "Failed to load notifications." });
  }
};

// PATCH /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid notification ID." });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { $set: { read: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found.",
      });
    }

    await auditLogger({
      actor: req.user.id,
      action: "NOTIFICATION_READ",
      entity: "Notification",
      entityId: notification._id,
    });

    return res.json({ success: true, notification });
  } catch (error) {
    console.error("Mark notification read:", error);
    return res.status(500).json({ message: "Failed to update notification." });
  }
};

// PATCH /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { $set: { read: true } }
    );

    return res.json({
      success: true,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Mark all notifications read:", error);
    return res.status(500).json({ message: "Failed to update notifications." });
  }
};
