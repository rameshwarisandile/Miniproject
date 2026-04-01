const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const MoodArt = require("../models/MoodArt");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();

const GEMINI_API_KEY = process.env.KEY || "";
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-2.5-flash" }) : null;

const buildPrompt = (inputText) => [
  "You are an art director for generative therapy.",
  "Convert the user's feelings into an abstract digital painting concept.",
  "Return ONLY valid minified JSON with keys:",
  '{"title":"short artistic title","moodSummary":"1 line mood interpretation","composition":"1 sentence describing the scene","palette":["#hex1","#hex2","#hex3","#hex4","#hex5"],"overlayText":"1 short poetic line","socialCaption":"short caption for social media","shapes":[{"type":"orb|wave|spark|mist|glow|petal|moon","x":0.1,"y":0.2,"size":0.3,"opacity":0.4,"rotation":20,"color":"#hex"}]}',
  "Keep it emotionally sensitive, calm, and visually rich.",
  "Prefer painterly sweeps, layered forms, and soft gradients instead of tiny dots.",
  "Generate 8 to 12 medium/large shapes distributed across the canvas.",
  "Do not mention policy or diagnosis.",
  `User feeling description: ${inputText}`,
].join("\n");

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

  return presets[mood] || presets.reflective;
};

router.post("/generate", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const inputText = String(req.body?.inputText || "").trim();

    if (!inputText) {
      return res.status(400).json({ message: "inputText is required" });
    }

    const fallback = buildFallbackArt(inputText);

    if (!model) {
      const saved = await MoodArt.create({
        user: userId,
        inputText,
        ...fallback,
        source: "fallback",
        rawResponse: JSON.stringify({ mode: "fallback", reason: "missing_key" }),
      });

      return res.json({ ...fallback, id: saved._id, createdAt: saved.createdAt, source: "fallback" });
    }

    const prompt = buildPrompt(inputText);
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
        shapes: Array.isArray(parsed?.shapes) && parsed.shapes.length > 0 ? parsed.shapes.slice(0, 12) : fallback.shapes,
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

      return res.json({ ...fallback, id: saved._id, createdAt: saved.createdAt, source: "fallback-auth" });
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
