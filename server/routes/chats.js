const express = require("express");
const Chat = require("../models/Chat");
const jwt = require("jsonwebtoken");
const router = express.Router();
const CryptoJS = require("crypto-js");
const CHAT_SECRET_KEY = process.env.CHAT_SECRET_KEY || "your_secret_key";

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

// Add chat
router.post("/", authMiddleware, async (req, res) => {
  try {
    // Encrypt message and reply
    const encryptedMessage = CryptoJS.AES.encrypt(req.body.message, CHAT_SECRET_KEY).toString();
    const encryptedReply = req.body.reply
      ? CryptoJS.AES.encrypt(req.body.reply, CHAT_SECRET_KEY).toString()
      : undefined;
    const newChat = new Chat({
      user: req.userId,
      message: encryptedMessage,
      reply: encryptedReply,
    });
    await newChat.save();
    res.status(201).json(newChat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get chats for logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const chats = await Chat.find({ user: req.userId }).sort({ createdAt: -1 });
    // Decrypt messages before sending
    const decryptedChats = chats.map(chat => {
      const bytesMsg = CryptoJS.AES.decrypt(chat.message, CHAT_SECRET_KEY);
      const decryptedMessage = bytesMsg.toString(CryptoJS.enc.Utf8);
      let decryptedReply = undefined;
      if (chat.reply) {
        const bytesReply = CryptoJS.AES.decrypt(chat.reply, CHAT_SECRET_KEY);
        decryptedReply = bytesReply.toString(CryptoJS.enc.Utf8);
      }
      return {
        ...chat.toObject(),
        message: decryptedMessage,
        reply: decryptedReply,
      };
    });
    res.json(decryptedChats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
