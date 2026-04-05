const mongoose = require("mongoose");

const journalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    gratitude: [String],
    reflection: String,
    mood: String,
    sleepQuality: { type: String, enum: ["excellent", "good", "fair", "poor", ""] },
    sleepHours: { type: Number, min: 0, max: 24 },
    goals: [
      {
        id: String,
        text: String,
        completed: Boolean,
        createdAt: String,
        completedAt: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Journal", journalSchema);
