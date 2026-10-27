const cron = require("node-cron");
const FollowUp = require("../models/FollowUp");
const Notification = require("../models/Notification");

async function createNotificationOnce(data) {
  try {
    await Notification.updateOne(
      {
        user: data.user,
        followUp: data.followUp,
        type: data.type,
      },
      {
        $setOnInsert: data,
      },
      { upsert: true }
    );
  } catch (error) {
    // Unique index concurrency માં duplicate insert અટકાવે.
    if (error.code !== 11000) throw error;
  }
}

async function processNotifications() {
  const now = new Date();

  // Scheduled reminder time આવી ગયેલા pending tasks
  const reminders = await FollowUp.find({
    status: "pending",
    reminderAt: { $lte: now },
    reminderSentAt: null,
  }).limit(200);

  for (const task of reminders) {
    await createNotificationOnce({
      user: task.assignedTo,
      followUp: task._id,
      type: "upcoming",
      message: `Reminder: ${task.title}`,
    });

    task.reminderSentAt = now;
    await task.save();
  }

  // Due date પસાર થઈ ગયેલા pending tasks
  const overdueTasks = await FollowUp.find({
    status: "pending",
    dueDate: { $lt: now },
  }).limit(200);

  for (const task of overdueTasks) {
    await createNotificationOnce({
      user: task.assignedTo,
      followUp: task._id,
      type: "overdue",
      message: `Overdue: ${task.title}`,
    });
  }
}

function startNotificationScheduler() {
  // દર મિનિટે reminders ચેક કરે.
  cron.schedule("* * * * *", async () => {
    try {
      await processNotifications();
    } catch (error) {
      console.error("Notification scheduler error:", error);
    }
  });
}

module.exports = {
  startNotificationScheduler,
  processNotifications,
};