const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const authRoutes = require("./routes/auth");
const moodsRoutes = require("./routes/moods");
const chatsRoutes = require("./routes/chats");
const analyticsRoutes = require("./routes/analytics");
const journalRoutes = require("./routes/journal");

dotenv.config();


const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const genAI = new GoogleGenerativeAI(process.env.KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash"
});

app.post("/ask", async (req, res) => {
  try {

    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        status: false,
        reply: "Message is required"
      });
    }

    const result = await model.generateContent(message);

    const reply = result.response.text();

    res.json({
      status: true,
      reply: reply
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      status: false,
      reply: "AI error occurred"
    });

  }
});

app.post("/api/ask", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({
        status: false,
        reply: "Message is required"
      });
    }
    const result = await model.generateContent(message);
    const reply = result.response.text();
    res.json({
      status: true,
      reply: reply
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: false,
      reply: "AI error occurred"
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/moods", moodsRoutes);
app.use("/api/chats", chatsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/journal", journalRoutes);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT || 8120, () => {
      console.log("Server running on port " + (process.env.PORT || 8120));
      console.log("Connected to MongoDB at " + process.env.MONGO_URI);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });