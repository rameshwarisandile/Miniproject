const express = require("express");
const Mood = require("../models/Mood");
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

// Add mood
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { mood, note } = req.body;
    const newMood = new Mood({ user: req.userId, mood, note });
    await newMood.save();
    res.status(201).json(newMood);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get moods for logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const moods = await Mood.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(moods);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
