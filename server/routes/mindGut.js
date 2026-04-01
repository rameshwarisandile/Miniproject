const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const authMiddleware = require("../middleware/authMiddleware");
const MindGutSuggestion = require("../models/MindGutSuggestion");

const router = express.Router();

const GEMINI_API_KEY = process.env.KEY || "";
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-2.5-flash" }) : null;

const isGeminiAuthError = (error) => {
  const message = (error?.message || "").toLowerCase();
  return (
    message.includes("403") ||
    message.includes("unregistered callers") ||
    message.includes("api key") ||
    message.includes("forbidden")
  );
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

const normalizeMood = (value) => String(value || "").toLowerCase();

const buildPrompt = (inputText) => [
  "You are a wellness nutrition guide focused on the mind-gut connection.",
  "Given a user's mood text, suggest practical food ideas that support emotional wellbeing.",
  "Keep response supportive, non-medical, and realistic for Indian daily food options where possible.",
  "Return ONLY minified valid JSON with this exact shape:",
  '{"moodLabel":"short mood name","suggestionSummary":"1 line care-focused summary","whyItHelps":"1 concise explanation linking food and mood","foods":[{"name":"food name","reason":"why this helps","timing":"when to take","nutrients":["item1","item2"]}],"avoid":["item1","item2"],"hydrationTip":"1 short hydration tip"}',
  "Rules:",
  "- 3 to 5 foods.",
  "- Foods should be practical and easy to find.",
  "- Avoid disease claims and prescriptions.",
  `User mood text: ${inputText}`,
].join("\n");

const fallbackSuggestion = (inputText) => {
  const text = normalizeMood(inputText);

  if (/(anxious|stress|worried|nervous|panic|bechain)/.test(text)) {
    return {
      moodLabel: "Anxious",
      suggestionSummary: "Your body may benefit from calming, gut-friendly foods right now.",
      whyItHelps: "Fermented foods and magnesium-rich snacks can support gut balance and help your system settle.",
      foods: [
        {
          name: "Plain curd or yogurt",
          reason: "Contains probiotics that support gut health and may help stress response.",
          timing: "Mid-morning or with lunch",
          nutrients: ["probiotics", "protein"],
        },
        {
          name: "Handful of mixed nuts",
          reason: "Provides healthy fats and magnesium for steady energy and calmer mood.",
          timing: "Evening snack",
          nutrients: ["magnesium", "omega fats"],
        },
        {
          name: "Banana with peanut butter",
          reason: "Simple combo for stable energy when anxiety feels draining.",
          timing: "Late afternoon",
          nutrients: ["potassium", "vitamin B6"],
        },
      ],
      avoid: ["Too much caffeine on an empty stomach", "Ultra-sugary drinks"],
      hydrationTip: "Sip water every 60-90 minutes; dehydration can amplify restlessness.",
    };
  }

  if (/(sad|low|down|lonely|blue)/.test(text)) {
    return {
      moodLabel: "Low Mood",
      suggestionSummary: "Warm, balanced meals can support emotional comfort and energy.",
      whyItHelps: "Complex carbs, protein, and omega fats may help with steadier mood and less emotional crashes.",
      foods: [
        {
          name: "Khichdi with vegetables",
          reason: "Gentle on gut and comforting when appetite is low.",
          timing: "Lunch or dinner",
          nutrients: ["fiber", "complex carbs"],
        },
        {
          name: "Egg or paneer wrap",
          reason: "Protein supports stable energy and reduces mood dips.",
          timing: "Breakfast or early dinner",
          nutrients: ["protein", "vitamin B12"],
        },
        {
          name: "Walnuts and dates",
          reason: "A quick snack with healthy fats and natural sweetness.",
          timing: "4-6 PM snack",
          nutrients: ["omega-3", "iron"],
        },
      ],
      avoid: ["Skipping meals", "Late-night heavy fried food"],
      hydrationTip: "Keep a bottle nearby and add lemon or mint if plain water feels boring.",
    };
  }

  return {
    moodLabel: "Balanced",
    suggestionSummary: "You can maintain this mood with light, nourishing, gut-friendly meals.",
    whyItHelps: "A balanced plate with fiber, fermented foods, and hydration helps keep mood and digestion steady.",
    foods: [
      {
        name: "Curd rice or millet bowl",
        reason: "Supports digestion while providing steady energy.",
        timing: "Lunch",
        nutrients: ["probiotics", "complex carbs"],
      },
      {
        name: "Fruit and seed bowl",
        reason: "Adds antioxidants and fiber for gut and brain support.",
        timing: "Morning snack",
        nutrients: ["fiber", "vitamin C"],
      },
      {
        name: "Moong chilla with chutney",
        reason: "Protein-rich and easy for regular daily routine.",
        timing: "Breakfast",
        nutrients: ["protein", "folate"],
      },
    ],
    avoid: ["Long gaps between meals"],
    hydrationTip: "Start your day with water, then maintain small sips throughout the day.",
  };
};

router.post("/suggest", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const inputText = String(req.body?.inputText || "").trim();

    if (!inputText) {
      return res.status(400).json({ message: "inputText is required" });
    }

    const fallback = fallbackSuggestion(inputText);

    if (!model) {
      const saved = await MindGutSuggestion.create({
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
        moodLabel: parsed?.moodLabel || fallback.moodLabel,
        suggestionSummary: parsed?.suggestionSummary || fallback.suggestionSummary,
        whyItHelps: parsed?.whyItHelps || fallback.whyItHelps,
        foods: Array.isArray(parsed?.foods) && parsed.foods.length > 0 ? parsed.foods.slice(0, 5) : fallback.foods,
        avoid: Array.isArray(parsed?.avoid) ? parsed.avoid.slice(0, 4) : fallback.avoid,
        hydrationTip: parsed?.hydrationTip || fallback.hydrationTip,
      };

      const saved = await MindGutSuggestion.create({
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

      const saved = await MindGutSuggestion.create({
        user: userId,
        inputText,
        ...fallback,
        source: "fallback-auth",
        rawResponse: String(aiError?.message || "gemini auth error"),
      });

      return res.json({ ...fallback, id: saved._id, createdAt: saved.createdAt, source: "fallback-auth" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message || "Mind-Gut suggestion failed" });
  }
});

router.get("/history", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const history = await MindGutSuggestion.find({ user: userId }).sort({ createdAt: -1 }).limit(20).lean();
    return res.json(history);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to load Mind-Gut history" });
  }
});

module.exports = router;
