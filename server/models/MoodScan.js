const mongoose = require("mongoose");

const moodScanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    voiceNote: { type: String, default: "" },
    imageCaptured: { type: Boolean, default: true },
    detectedEmotion: { type: String, default: "neutral" },
    energyLevel: { type: String, default: "medium" },
    fatigueDetected: { type: Boolean, default: false },
    confidence: { type: Number, default: 0.5 },
    wellbeingPrompt: { type: String, default: "Aap kaise feel kar rahe hain?" },
    supportiveSuggestions: { type: [String], default: [] },
    rawResponse: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("MoodScan", moodScanSchema);
