const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const EngagementLog = require("../models/EngagementLog");

const router = express.Router();

router.post("/log", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { category, eventType, title, message, metadata } = req.body || {};

    if (!category || !eventType) {
      return res.status(400).json({ message: "category and eventType are required" });
    }

    const saved = await EngagementLog.create({
      user: userId,
      category,
      eventType,
      title: title || "",
      message: message || "",
      metadata: metadata || {},
      deliveredAt: new Date(),
    });

    return res.status(201).json({ id: saved._id, message: "Event logged" });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to store engagement log" });
  }
});

router.get("/history", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const logs = await EngagementLog.find({ user: userId }).sort({ createdAt: -1 }).limit(100).lean();
    return res.json(logs);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to fetch engagement history" });
  }
});

module.exports = router;
