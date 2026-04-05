const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const MoodArt = require("../models/MoodArt");
const Mood = require("../models/Mood");
const Chat = require("../models/Chat");
const MoodScan = require("../models/MoodScan");
const Journal = require("../models/Journal");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const CryptoJS = require("crypto-js");

const router = express.Router();

const GEMINI_API_KEY = process.env.KEY || "";
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-2.5-flash" }) : null;
const CHAT_SECRET_KEY = process.env.CHAT_SECRET_KEY || "your_secret_key";
const ALLOWED_STYLE_MODES = new Set(["cinematic", "dreamy", "bold", "minimal"]);

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

// Helper function to fetch today's data from all sources
const getTodayData = async (userId) => {
  try {
    const today = getTodayDate();
    const todayStart = new Date(today);
    const todayEnd = new Date(today);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // Fetch today's mood entries
    const todayMoods = await Mood.find({
      user: userId,
      createdAt: { $gte: todayStart, $lt: todayEnd }
    }).lean();

    // Fetch journal entry for today
    const todayJournal = await Journal.findOne({
      user: userId,
      date: today
    }).lean();

    // Fetch today's chat history
    const todayChats = await Chat.find({
      user: userId,
      createdAt: { $gte: todayStart, $lt: todayEnd }
    }).lean();

    // Decrypt chat messages
    const decryptedChats = todayChats.map(chat => {
      try {
        const bytesMsg = CryptoJS.AES.decrypt(chat.message || "", CHAT_SECRET_KEY);
        const message = bytesMsg.toString(CryptoJS.enc.Utf8) || "";
        let reply = "";
        if (chat.reply) {
          const bytesReply = CryptoJS.AES.decrypt(chat.reply, CHAT_SECRET_KEY);
          reply = bytesReply.toString(CryptoJS.enc.Utf8) || "";
        }
        return { message, reply };
      } catch {
        return { message: "", reply: "" };
      }
    });

    // Fetch today's mood scans
    const todayMoodScans = await MoodScan.find({
      user: userId,
      createdAt: { $gte: todayStart, $lt: todayEnd }
    }).lean();

    return {
      moods: todayMoods,
      journal: todayJournal,
      chats: decryptedChats,
      moodScans: todayMoodScans
    };
  } catch (err) {
    console.error("Error fetching today's data:", err);
    return {
      moods: [],
      journal: null,
      chats: [],
      moodScans: []
    };
  }
};

// Helper function to build context from collected data
const buildContextFromData = (todayData) => {
  const parts = [];

  // Add mood entries context
  if (todayData.moods && todayData.moods.length > 0) {
    const moodsSummary = todayData.moods.map(m => `${m.mood}${m.note ? ` (${m.note})` : ""}`).join(", ");
    parts.push(`Today's mood entries: ${moodsSummary}`);
  }

  // Add journal context
  if (todayData.journal) {
    const journalParts = [];
    if (todayData.journal.mood) journalParts.push(`Mood: ${todayData.journal.mood}`);
    if (todayData.journal.reflection) journalParts.push(`Reflection: ${todayData.journal.reflection}`);
    if (todayData.journal.gratitude && todayData.journal.gratitude.length > 0) {
      journalParts.push(`Grateful for: ${todayData.journal.gratitude.join(", ")}`);
    }
    if (journalParts.length > 0) {
      parts.push(`Journal entry: ${journalParts.join("; ")}`);
    }
  }

  // Add chat context (summary of key themes)
  if (todayData.chats && todayData.chats.length > 0) {
    const chatTexts = todayData.chats
      .filter(c => c.message || c.reply)
      .map(c => `${c.message} ${c.reply}`.trim())
      .filter(t => t.length > 0)
      .slice(0, 3);
    if (chatTexts.length > 0) {
      parts.push(`Recent chat topics: ${chatTexts.join("; ")}`);
    }
  }

  // Add mood scan context
  if (todayData.moodScans && todayData.moodScans.length > 0) {
    const scans = todayData.moodScans.slice(-2); // Last 2 scans
    const scansSummary = scans
      .map(s => `${s.detectedEmotion || "neutral"} (confidence: ${(s.confidence * 100).toFixed(0)}%)`)
      .join(", ");
    parts.push(`Recent mood scans: ${scansSummary}`);
  }

  return parts.length > 0 ? parts.join("\n") : null;
};

const getStyleGuidance = (styleMode = "cinematic") => {
  const style = String(styleMode || "cinematic").toLowerCase();
  if (style === "dreamy") {
    return "Style mode: Dreamy. Use airy composition, soft transitions, pastel lighting, floating forms, and calm emotional tone.";
  }
  if (style === "bold") {
    return "Style mode: Bold. Use confident strokes, high contrast, energetic rhythm, strong focal highlights, and dramatic color separation.";
  }
  if (style === "minimal") {
    return "Style mode: Minimal. Use fewer focal masses, intentional negative space, clean gradients, subtle texture, and elegant restraint.";
  }
  return "Style mode: Cinematic. Use layered depth, atmospheric glow, painterly gradients, and strong foreground-midground-background separation.";
};

const buildPrompt = (inputText, contextFromData = null, styleMode = "cinematic", variationSeed = 0) => {
  const basePrompt = [
    "You are an art director for generative therapy.",
    "Convert the user's feelings into an abstract digital painting concept.",
    "Return ONLY valid minified JSON with keys:",
    '{"title":"short artistic title","moodSummary":"1 line mood interpretation","composition":"1 sentence describing the scene","palette":["#hex1","#hex2","#hex3","#hex4","#hex5"],"overlayText":"1 short poetic line","socialCaption":"short caption for social media","shapes":[{"type":"orb|wave|spark|mist|glow|petal|moon|rain","x":0.1,"y":0.2,"size":0.3,"opacity":0.4,"rotation":20,"color":"#hex"}]}',
    "Keep it emotionally sensitive, calm, and visually rich.",
    "Avoid flat coloring-book or childish look.",
    "Prefer cinematic painterly sweeps, layered forms, atmospheric depth, and focal contrast.",
    "Use cohesive palette harmony (avoid random neon clashes unless emotionally justified).",
    "Generate 10 to 16 overlapping shapes distributed with foreground, midground, and background depth.",
    getStyleGuidance(styleMode),
    `Variation seed: ${String(variationSeed || 0)}. Respect this seed to generate a distinct but relevant visual arrangement.`,
    "Do not mention policy or diagnosis.",
  ];

  if (contextFromData) {
    basePrompt.push("Consider the user's day holistically based on their mood log, journal, chats, and facial expressions:");
    basePrompt.push(contextFromData);
  }

  basePrompt.push(`User feeling description: ${inputText}`);

  return basePrompt.join("\n");
};

const isGeminiAuthError = (error) => {
  const message = (error?.message || "").toLowerCase();
  return message.includes("403") || message.includes("unregistered callers") || message.includes("api key") || message.includes("forbidden");
};

const parseJsonFromModel = (text) => {
  const trimmed = (text || "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return null;
  }
};

const slugToSentence = (value) => String(value || "").toLowerCase();

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const normalizeShape = (shape, fallbackColor = "#E2E8F0") => {
  const type = String(shape?.type || "orb").toLowerCase();
  const allowedType = ["orb", "wave", "spark", "mist", "glow", "petal", "moon", "rain"].includes(type) ? type : "orb";
  return {
    type: allowedType,
    x: clamp(Number(shape?.x ?? 0.5), 0.06, 0.94),
    y: clamp(Number(shape?.y ?? 0.5), 0.06, 0.94),
    size: clamp(Number(shape?.size ?? 0.24), 0.1, 0.7),
    opacity: clamp(Number(shape?.opacity ?? 0.48), 0.12, 0.9),
    rotation: Number(shape?.rotation ?? 0),
    color: typeof shape?.color === "string" && shape.color.trim() ? shape.color : fallbackColor,
  };
};

const enrichShapes = (shapes, palette = []) => {
  const safePalette = Array.isArray(palette) && palette.length ? palette : ["#E2E8F0", "#A78BFA", "#38BDF8", "#F472B6", "#FDE68A"];
  const base = Array.isArray(shapes) ? shapes.map((shape, idx) => normalizeShape(shape, safePalette[idx % safePalette.length])) : [];
  const normalizedBase = base.length > 0 ? base : [normalizeShape({}, safePalette[0])];

  if (normalizedBase.length >= 8) {
    return normalizedBase.slice(0, 12);
  }

  const extras = [];
  const target = 10;
  while (normalizedBase.length + extras.length < target) {
    const i = extras.length;
    const seed = normalizedBase[i % normalizedBase.length];
    const color = safePalette[(i + 2) % safePalette.length] || seed.color;
    extras.push(
      normalizeShape(
        {
          type: i % 3 === 0 ? "mist" : i % 3 === 1 ? "wave" : "glow",
          x: (seed.x + 0.11 * (i + 1)) % 1,
          y: (seed.y + 0.07 * (i + 2)) % 1,
          size: seed.size * (0.78 + (i % 4) * 0.16),
          opacity: seed.opacity * 0.74,
          rotation: seed.rotation + (i + 1) * 17,
          color,
        },
        color
      )
    );
  }

  return [...normalizedBase, ...extras].slice(0, 12);
};

const buildFallbackArt = (inputText) => {
  const text = slugToSentence(inputText);
  const mood = /happy|joy|smile|excited|grateful/.test(text)
    ? "uplifted"
    : /sad|blue|cry|lonely/.test(text)
      ? "tender"
      : /angry|frustrat|mad|annoy/.test(text)
        ? "fiery"
        : /anxious|fear|worry|nervous|darr/.test(text)
          ? "restless"
          : /calm|peace|relax|quiet/.test(text)
            ? "calm"
            : /tired|sleep|thak|neend/.test(text)
              ? "restful"
              : "reflective";

  const presets = {
    uplifted: {
      title: "Golden Drift",
      moodSummary: "Warm hope and light confidence are rising together.",
      composition: "Sunlit orbs float upward through a soft horizon of glowing color.",
      palette: ["#FDE68A", "#FB7185", "#F97316", "#A78BFA", "#38BDF8"],
      overlayText: "Let the light stay.",
      socialCaption: "A gentle visual reminder that bright moments can be held softly.",
      shapes: [
        { type: "orb", x: 0.18, y: 0.22, size: 0.28, opacity: 0.84, rotation: 0, color: "#FDE68A" },
        { type: "orb", x: 0.68, y: 0.18, size: 0.2, opacity: 0.68, rotation: 0, color: "#FB7185" },
        { type: "wave", x: 0.08, y: 0.62, size: 0.55, opacity: 0.55, rotation: -8, color: "#A78BFA" },
        { type: "spark", x: 0.77, y: 0.35, size: 0.11, opacity: 0.86, rotation: 18, color: "#38BDF8" },
      ],
    },
    tender: {
      title: "Soft Rain Memory",
      moodSummary: "There is sadness here, but also tenderness and care.",
      composition: "Slow watercolor clouds carry a quiet rain of silver and blue.",
      palette: ["#1D4ED8", "#60A5FA", "#A5B4FC", "#F8FAFC", "#0F172A"],
      overlayText: "Even soft rain can heal.",
      socialCaption: "For the days when the heart is heavy but still open.",
      shapes: [
        { type: "mist", x: 0.1, y: 0.12, size: 0.34, opacity: 0.6, rotation: -12, color: "#60A5FA" },
        { type: "rain", x: 0.72, y: 0.18, size: 0.38, opacity: 0.44, rotation: 8, color: "#A5B4FC" },
        { type: "orb", x: 0.24, y: 0.72, size: 0.28, opacity: 0.58, rotation: 0, color: "#1D4ED8" },
        { type: "glow", x: 0.8, y: 0.76, size: 0.18, opacity: 0.42, rotation: 0, color: "#F8FAFC" },
      ],
    },
    fiery: {
      title: "Crimson Echo",
      moodSummary: "Intensity is loud right now, but it can still be shaped beautifully.",
      composition: "Sharp ribbons and ember-like circles move across a deep warm canvas.",
      palette: ["#7F1D1D", "#DC2626", "#F97316", "#FDBA74", "#1F2937"],
      overlayText: "Breathe before the flame moves.",
      socialCaption: "A reminder that strong feelings can become powerful art.",
      shapes: [
        { type: "wave", x: 0.1, y: 0.18, size: 0.42, opacity: 0.68, rotation: -18, color: "#DC2626" },
        { type: "orb", x: 0.72, y: 0.28, size: 0.22, opacity: 0.8, rotation: 0, color: "#FDBA74" },
        { type: "spark", x: 0.52, y: 0.7, size: 0.14, opacity: 0.88, rotation: 28, color: "#F97316" },
        { type: "glow", x: 0.82, y: 0.78, size: 0.2, opacity: 0.48, rotation: 0, color: "#7F1D1D" },
      ],
    },
    restless: {
      title: "Quiet Spiral",
      moodSummary: "Restlessness is turning in circles and asking for grounding.",
      composition: "Cool spirals and soft sparks orbit a calm center of light.",
      palette: ["#0F172A", "#1E293B", "#38BDF8", "#A78BFA", "#E2E8F0"],
      overlayText: "You are safe in the pause.",
      socialCaption: "For anxious moments that need a softer rhythm.",
      shapes: [
        { type: "wave", x: 0.15, y: 0.2, size: 0.44, opacity: 0.5, rotation: -22, color: "#38BDF8" },
        { type: "orb", x: 0.72, y: 0.22, size: 0.24, opacity: 0.74, rotation: 0, color: "#A78BFA" },
        { type: "mist", x: 0.42, y: 0.65, size: 0.32, opacity: 0.62, rotation: 14, color: "#1E293B" },
        { type: "spark", x: 0.8, y: 0.72, size: 0.1, opacity: 0.9, rotation: 0, color: "#E2E8F0" },
      ],
    },
    calm: {
      title: "Still Water Sky",
      moodSummary: "A quiet balance is creating space to breathe.",
      composition: "Floating light settles over a serene gradient with gentle reflections.",
      palette: ["#0F766E", "#14B8A6", "#99F6E4", "#E0F2FE", "#0EA5E9"],
      overlayText: "Stay with the stillness.",
      socialCaption: "A calm visual for centered days.",
      shapes: [
        { type: "glow", x: 0.18, y: 0.2, size: 0.22, opacity: 0.72, rotation: 0, color: "#99F6E4" },
        { type: "orb", x: 0.65, y: 0.18, size: 0.2, opacity: 0.62, rotation: 0, color: "#E0F2FE" },
        { type: "wave", x: 0.08, y: 0.64, size: 0.48, opacity: 0.5, rotation: 4, color: "#14B8A6" },
        { type: "spark", x: 0.8, y: 0.76, size: 0.1, opacity: 0.8, rotation: 0, color: "#0EA5E9" },
      ],
    },
    restful: {
      title: "Dusk Rest",
      moodSummary: "Fatigue is asking for rest, and that need is valid.",
      composition: "Soft dusk tones wrap around sleepy light and slow drifting forms.",
      palette: ["#312E81", "#4C1D95", "#818CF8", "#C7D2FE", "#111827"],
      overlayText: "Rest is also progress.",
      socialCaption: "A gentle rest-first artwork for tired days.",
      shapes: [
        { type: "moon", x: 0.16, y: 0.18, size: 0.18, opacity: 0.72, rotation: 0, color: "#C7D2FE" },
        { type: "orb", x: 0.68, y: 0.24, size: 0.24, opacity: 0.66, rotation: 0, color: "#818CF8" },
        { type: "mist", x: 0.18, y: 0.68, size: 0.42, opacity: 0.48, rotation: -10, color: "#312E81" },
        { type: "glow", x: 0.82, y: 0.78, size: 0.16, opacity: 0.42, rotation: 0, color: "#4C1D95" },
      ],
    },
    reflective: {
      title: "Open Horizon",
      moodSummary: "Mixed feelings are moving toward clarity and shape.",
      composition: "Layered color fields open into a horizon with luminous abstract particles.",
      palette: ["#0F172A", "#1D4ED8", "#A78BFA", "#F472B6", "#F8FAFC"],
      overlayText: "Let the feeling unfold.",
      socialCaption: "An abstract reflection of everything you carry today.",
      shapes: [
        { type: "wave", x: 0.1, y: 0.2, size: 0.48, opacity: 0.56, rotation: -8, color: "#1D4ED8" },
        { type: "orb", x: 0.7, y: 0.24, size: 0.24, opacity: 0.76, rotation: 0, color: "#F472B6" },
        { type: "spark", x: 0.34, y: 0.72, size: 0.1, opacity: 0.88, rotation: 16, color: "#F8FAFC" },
        { type: "glow", x: 0.84, y: 0.76, size: 0.2, opacity: 0.46, rotation: 0, color: "#A78BFA" },
      ],
    },
  };

  const selected = presets[mood] || presets.reflective;
  return {
    ...selected,
    shapes: enrichShapes(selected.shapes, selected.palette),
  };
};

router.post("/generate", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const inputText = String(req.body?.inputText || "").trim();
    const requestedStyleMode = String(req.body?.styleMode || "cinematic").toLowerCase();
    const styleMode = ALLOWED_STYLE_MODES.has(requestedStyleMode) ? requestedStyleMode : "cinematic";
    const variationSeed = Number(req.body?.variationSeed || 0);

    if (!inputText) {
      return res.status(400).json({ message: "inputText is required" });
    }

    const fallback = buildFallbackArt(inputText);

    // Fetch today's data from all sources
    const todayData = await getTodayData(userId);
    const contextFromData = buildContextFromData(todayData);

    if (!model) {
      const saved = await MoodArt.create({
        user: userId,
        inputText,
        ...fallback,
        source: "fallback",
        rawResponse: JSON.stringify({ mode: "fallback", reason: "missing_key" }),
      });

      return res.json({ ...fallback, id: saved._id, createdAt: saved.createdAt, source: "fallback", styleMode });
    }

    const prompt = buildPrompt(inputText, contextFromData, styleMode, variationSeed);
    try {
      const result = await model.generateContent(prompt);
      const replyText = result?.response?.text?.() || "";
      const parsed = parseJsonFromModel(replyText);

      const normalized = {
        title: parsed?.title || fallback.title,
        moodSummary: parsed?.moodSummary || fallback.moodSummary,
        composition: parsed?.composition || fallback.composition,
        palette: Array.isArray(parsed?.palette) && parsed.palette.length >= 3 ? parsed.palette.slice(0, 5) : fallback.palette,
        overlayText: parsed?.overlayText || fallback.overlayText,
        socialCaption: parsed?.socialCaption || fallback.socialCaption,
        shapes: enrichShapes(Array.isArray(parsed?.shapes) ? parsed.shapes : fallback.shapes, Array.isArray(parsed?.palette) ? parsed.palette : fallback.palette),
        styleMode,
      };

      const saved = await MoodArt.create({
        user: userId,
        inputText,
        ...normalized,
        source: "ai",
        rawResponse: replyText,
      });

      return res.json({ ...normalized, id: saved._id, createdAt: saved.createdAt, source: "ai" });
    } catch (aiError) {
      if (!isGeminiAuthError(aiError)) {
        throw aiError;
      }

      const saved = await MoodArt.create({
        user: userId,
        inputText,
        ...fallback,
        source: "fallback-auth",
        rawResponse: String(aiError?.message || "gemini auth error"),
      });

      return res.json({ ...fallback, id: saved._id, createdAt: saved.createdAt, source: "fallback-auth", styleMode });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message || "Mood art generation failed" });
  }
});

router.get("/history", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const history = await MoodArt.find({ user: userId }).sort({ createdAt: -1 }).limit(20).lean();
    return res.json(history);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to load mood art history" });
  }
});

module.exports = router;
