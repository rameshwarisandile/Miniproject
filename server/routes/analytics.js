const express = require("express");
const Analytics = require("../models/Analytics");
const jwt = require("jsonwebtoken");
const router = express.Router();

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

// Add analytics
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { data } = req.body;
    const newAnalytics = new Analytics({ user: req.userId, data });
    await newAnalytics.save();
    res.status(201).json(newAnalytics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get analytics for logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const analytics = await Analytics.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(analytics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
