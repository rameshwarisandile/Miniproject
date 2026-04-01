const mongoose = require("mongoose");

const mindGutFoodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    reason: { type: String, default: "" },
    timing: { type: String, default: "" },
    nutrients: { type: [String], default: [] },
  },
  { _id: false },
);

const mindGutSuggestionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    inputText: { type: String, required: true },
    moodLabel: { type: String, default: "Reflective" },
    suggestionSummary: { type: String, default: "" },
    whyItHelps: { type: String, default: "" },
    foods: { type: [mindGutFoodSchema], default: [] },
    avoid: { type: [String], default: [] },
    hydrationTip: { type: String, default: "" },
    source: { type: String, default: "fallback" },
    rawResponse: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("MindGutSuggestion", mindGutSuggestionSchema);
