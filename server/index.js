const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Always load env from server/.env before importing routes that read process.env at module load.
dotenv.config({ path: path.join(__dirname, ".env") });

const authRoutes = require("./routes/auth");
const moodsRoutes = require("./routes/moods");
const chatsRoutes = require("./routes/chats");
const analyticsRoutes = require("./routes/analytics");
const journalRoutes = require("./routes/journal");
const preferencesRoutes = require("./routes/preferences");
const moodScannerRoutes = require("./routes/moodScanner");
const engagementRoutes = require("./routes/engagement");
const moodArtRoutes = require("./routes/moodArt");
const mindGutRoutes = require("./routes/mindGut");
const dailyZenRoutes = require("./routes/dailyZen");


const app = express();
const PORT = Number(process.env.PORT) || 8120;
let isMongoConnected = false;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (_req, res) => {
  res.json({
    status: true,
    service: "mood-nest-backend",
    port: PORT,
    mongoConnected: isMongoConnected,
  });
});

const GEMINI_API_KEY = process.env.KEY || "";
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-2.5-flash" }) : null;

const retryWithBackoff = async (fn, maxRetries = 3, initialDelayMs = 1000) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const msg = (error?.message || "").toLowerCase();
      // Only retry on 503 Service Unavailable
      if (!msg.includes("503") && !msg.includes("service unavailable")) {
        throw error;
      }
      if (i < maxRetries - 1) {
        const delayMs = initialDelayMs * Math.pow(2, i);
        console.log(`[ASK] Retry ${i + 1}/${maxRetries} after ${delayMs}ms due to service unavailable`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
};

const fallbackAskReply = (message = "") => {
  const text = String(message || "").toLowerCase();
  if (/(tired|thak|neend|sleep)/.test(text)) {
    return "Aap thode tired lag rahe hain. 10 minute break, pani aur deep breathing try karein.";
  }
  if (/(sad|low|anxious|stress|gussa|angry)/.test(text)) {
    return "Main aapke saath hoon. 2 minute slow breathing karein aur ek chhota next step choose karein.";
  }
  return "Main abhi limited mode me hoon. Aap apna mood note karein aur hydration + short mindful break try karein.";
};

const isGeminiAuthError = (error) => {
  const msg = (error?.message || "").toLowerCase();
  return msg.includes("403") || msg.includes("unregistered callers") || msg.includes("api key") || msg.includes("forbidden");
};

const isGeminiTemporaryError = (error) => {
  const msg = (error?.message || "").toLowerCase();
  return msg.includes("429") || msg.includes("503") || msg.includes("quota") || msg.includes("too many requests");
};

const askGeminiOrFallback = async (message) => {
  if (!model) {
    console.warn("[ASK] Model not initialized, using fallback");
    return fallbackAskReply(message);
  }

  try {
    console.log("[ASK] Calling Gemini API with message:", message.substring(0, 50));
    const result = await retryWithBackoff(() => model.generateContent(message), 3, 2000);
    const text = result?.response?.text?.();
    if (text) {
      console.log("[ASK] Gemini returned:", text.substring(0, 50));
      return text;
    }
    console.warn("[ASK] Gemini returned empty response, using fallback");
    return fallbackAskReply(message);
  } catch (error) {
    console.error("[ASK] Error from Gemini:", error.message);
    if (isGeminiAuthError(error) || isGeminiTemporaryError(error)) {
      console.log("[ASK] Temporary/Auth error detected, using fallback");
      return fallbackAskReply(message);
    }
    throw error;
  }
};

app.post("/ask", async (req, res) => {
  try {

    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        status: false,
        reply: "Message is required"
      });
    }

    const reply = await askGeminiOrFallback(message);

    res.json({
      status: true,
      reply,
      source: model ? "gemini-or-fallback" : "fallback"
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

    const reply = await askGeminiOrFallback(message);

    res.json({
      status: true,
      reply,
      source: model ? "gemini-or-fallback" : "fallback"
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
app.use("/api/preferences", preferencesRoutes);
app.use("/api/mood-scanner", moodScannerRoutes);
app.use("/api/engagement", engagementRoutes);
app.use("/api/mood-art", moodArtRoutes);
app.use("/api/mind-gut", mindGutRoutes);
app.use("/api/daily-zen", dailyZenRoutes);

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

// MongoDB connection (non-blocking startup)
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    isMongoConnected = true;
    console.log("Connected to MongoDB at " + process.env.MONGO_URI);
  })
  .catch((err) => {
    isMongoConnected = false;
    console.error("MongoDB connection error:", err);
  });