// const mongoose = require("mongoose");

// const notificationSchema = new mongoose.Schema(
//   {
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       index: true,
//     },
//     followUp: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "FollowUp",
//       default: null,
//     },
//     title: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     message: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     type: {
//       type: String,
//       enum: ["reminder", "overdue", "general"],
//       default: "reminder",
//     },
//     isRead: {
//       type: Boolean,
//       default: false,
//     },
//     readAt: {
//       type: Date,
//       default: null,
//     },
//   },
//   { timestamps: true }
// );

// notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

// // One notification per follow-up, recipient and type.
// notificationSchema.index(
//   { user: 1, followUp: 1, type: 1 },
//   {
//     unique: true,
//     partialFilterExpression: {
//       followUp: { $type: "objectId" },
//       type: { $in: ["reminder", "overdue"] },
//     },
//   }
// );

// module.exports = mongoose.model("Notification", notificationSchema);

const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    followUp: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FollowUp",
      default: null,
      index: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      default: "follow_up_due",
    },

    dueDate: {
      type: Date,
      default: null,
    },

    read: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({
  recipient: 1,
  read: 1,
  createdAt: -1,
});

module.exports =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
