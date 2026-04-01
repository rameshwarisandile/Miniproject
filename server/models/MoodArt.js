const mongoose = require("mongoose");

const moodArtSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    inputText: { type: String, required: true },
    title: { type: String, default: "Untitled Mood Painting" },
    moodSummary: { type: String, default: "" },
    palette: { type: [String], default: [] },
    composition: { type: String, default: "" },
    overlayText: { type: String, default: "" },
    socialCaption: { type: String, default: "" },
    shapes: { type: [mongoose.Schema.Types.Mixed], default: [] },
    source: { type: String, default: "fallback" },
    rawResponse: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("MoodArt", moodArtSchema);
