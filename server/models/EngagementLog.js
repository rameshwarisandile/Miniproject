const mongoose = require("mongoose");

const engagementLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: {
      type: String,
      enum: ["wellness-reminder", "social-interaction", "mood-scanner"],
      required: true,
    },
    eventType: { type: String, required: true },
    title: { type: String, default: "" },
    message: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    deliveredAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model("EngagementLog", engagementLogSchema);
