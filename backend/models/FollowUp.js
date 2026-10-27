
// const mongoose = require("mongoose");

// const activitySchema = new mongoose.Schema(
//   {
//     action: {
//       type: String,
//       enum: ["created", "updated", "assigned", "completed", "cancelled"],
//       required: true,
//     },
//     performedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     details: {
//       type: String,
//       default: "",
//     },
//     createdAt: {
//       type: Date,
//       default: Date.now,
//     },
//   },
//   { _id: true }
// );

// const followUpSchema = new mongoose.Schema(
//   {
//     lead: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Lead",
//       required: true,
//       index: true,
//     },
//     assignedTo: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       index: true,
//     },
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     title: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     type: {
//       type: String,
//       enum: ["call", "email", "meeting", "task"],
//       default: "task",
//     },
//     dueDate: {
//       type: Date,
//       required: true,
//       index: true,
//     },
//     priority: {
//       type: String,
//       enum: ["low", "medium", "high"],
//       default: "medium",
//     },
//     notes: {
//       type: String,
//       default: "",
//       trim: true,
//     },
//     status: {
//       type: String,
//       enum: ["pending", "completed", "cancelled"],
//       default: "pending",
//       index: true,
//     },
//     completedAt: {
//       type: Date,
//       default: null,
//     },
//     activityHistory: {
//       type: [activitySchema],
//       default: [],
//     },
//   },
//   { timestamps: true }
// );

// followUpSchema.index({ status: 1, dueDate: 1 });
// followUpSchema.index({ lead: 1, createdAt: -1 });
// followUpSchema.index({ assignedTo: 1, status: 1, dueDate: 1 });

// module.exports = mongoose.model("FollowUp", followUpSchema);


const mongoose = require("mongoose");

const followUpSchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true,'Activity title is required.'],
      trim: true,
    },
    type: {
      type: String,
      enum: ["call", "email", "meeting", "task", "Follow-up"],
      default: "Follow-up",
    },
    dueDate: {
      type: Date,
      required: [true,'Due data is required'],
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index:true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    notes:{
      type:String,
      default:"",
      trim:true,
    }
  },
  { timestamps: true }
);

followUpSchema.index({ status: 1, dueDate: 1, assignedTo: 1 });

module.exports = mongoose.models.FollowUp ||
  mongoose.model("FollowUp", followUpSchema,"followups");
