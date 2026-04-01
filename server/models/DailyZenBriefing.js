const mongoose = require("mongoose");

const dailyZenBriefingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, default: "User" },
    city: { type: String, default: "" },
    weatherNote: { type: String, default: "" },
    sleepHours: { type: Number, default: 0 },
    moodCountLast7Days: { type: Number, default: 0 },
    streakDays: { type: Number, default: 0 },
    todayGoal: { type: String, default: "5 minutes deep breathing" },
    greeting: { type: String, default: "" },
    weatherLine: { type: String, default: "" },
    recoveryLine: { type: String, default: "" },
    motivationLine: { type: String, default: "" },
    briefingText: { type: String, default: "" },
    actionChecklist: { type: [String], default: [] },
    source: { type: String, default: "fallback" },
    rawResponse: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("DailyZenBriefing", dailyZenBriefingSchema);
