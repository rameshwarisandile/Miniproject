const express = require("express");
const Journal = require("../models/Journal");
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

// Add journal entry
router.post("/", authMiddleware, async (req, res) => {
  try {
    const entry = new Journal({ ...req.body, user: req.userId });
    await entry.save();
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all journal entries for logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const entries = await Journal.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
