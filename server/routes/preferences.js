const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const UserPreference = require("../models/UserPreference");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const doc = await UserPreference.findOne({ user: userId }).lean();

    return res.json({
      smartWellnessReminders: doc?.smartWellnessReminders || null,
      humanSocialInteraction: doc?.humanSocialInteraction || null,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to fetch preferences" });
  }
});

router.put("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const updates = {};

    if (req.body.smartWellnessReminders && typeof req.body.smartWellnessReminders === "object") {
      updates.smartWellnessReminders = req.body.smartWellnessReminders;
    }

    if (req.body.humanSocialInteraction && typeof req.body.humanSocialInteraction === "object") {
      updates.humanSocialInteraction = req.body.humanSocialInteraction;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid preferences provided" });
    }

    const updated = await UserPreference.findOneAndUpdate(
      { user: userId },
      { $set: updates, $setOnInsert: { user: userId } },
      { new: true, upsert: true },
    ).lean();

    return res.json({
      message: "Preferences saved",
      smartWellnessReminders: updated?.smartWellnessReminders || null,
      humanSocialInteraction: updated?.humanSocialInteraction || null,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to save preferences" });
  }
});

module.exports = router;
