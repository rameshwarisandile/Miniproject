const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const MoodScan = require("../models/MoodScan");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();

let modelCache = null;
let modelCacheKey = "";

const getGeminiModel = () => {
  const key = (process.env.KEY || process.env.GEMINI_API_KEY || "").trim();
  if (!key) return null;

  if (!modelCache || modelCacheKey !== key) {
    const genAI = new GoogleGenerativeAI(key);
    modelCache = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    modelCacheKey = key;
  }

  return modelCache;
};

const ALLOWED_EMOTIONS = new Set(["happy", "calm", "tired", "anxious", "sad", "angry", "neutral"]);
const ALLOWED_ENERGY = new Set(["low", "medium", "high"]);

const buildPrompt = (voiceNote) => [
  "You are a facial-expression and voice-context emotion analyzer.",
  "Analyze the provided face image(s). If multiple frames are provided, use all frames and choose the dominant emotion.",
  "Use voice note only as secondary context; facial expression should be primary when face is visible.",
  "Return ONLY strict minified JSON:",
  '{"detectedEmotion":"happy|calm|tired|anxious|sad|angry|neutral","energyLevel":"low|medium|high","fatigueDetected":true/false,"confidence":0.0-1.0,"wellbeingPrompt":"2-3 word direct Hinglish supportive question or statement","supportiveSuggestions":["varied suggestion 1","varied suggestion 2","varied suggestion 3"]}',
  "CRITICAL: Generate UNIQUE wellbeingPrompt and supportiveSuggestions every time based on current expression/context.",
  "If expression is clearly smiling/laughing, prefer happy over neutral.",
  "If brows are tense/jaw tight/scowl is present, prefer angry or anxious over neutral.",
  "Use neutral only when expression is truly unclear/flat.",
  "Do not provide medical diagnosis.",
  "Keep supportiveSuggestions practical and short.",
  voiceNote ? `Voice note from user: "${voiceNote}"` : "No voice note provided.",
].join("\n");

const normalizeEmotion = (value) => {
  const emotion = String(value || "").toLowerCase().trim();
  return ALLOWED_EMOTIONS.has(emotion) ? emotion : "neutral";
};

const normalizeEnergy = (value) => {
  const energy = String(value || "").toLowerCase().trim();
  return ALLOWED_ENERGY.has(energy) ? energy : "medium";
};

const generateContextualSuggestions = (emotion, fatigueDetected, voiceNote = "") => {
  const suggestions = [];
  const voiceLower = voiceNote.toLowerCase();

  // Extract context from voice note
  const mentionedKeywords = {
    work: /(kaam|work|office|deadline|project)/i.test(voiceLower),
    sleep: /(neend|sleep|tired|thak)/i.test(voiceLower),
    stress: /(tension|stress|worried|ghabra)/i.test(voiceLower),
    social: /(friend|family|alone|loneliness)/i.test(voiceLower),
    food: /(bhookh|hungry|diet|khana)/i.test(voiceLower),
    exercise: /(exercise|walk|gym|fitness)/i.test(voiceLower),
  };

  // Emotion-specific suggestions with voice context
  if (emotion === "tired" || fatigueDetected) {
    if (mentionedKeywords.work) {
      suggestions.push("Work break lo aur 10-minute nap try kar.");
    } else if (mentionedKeywords.sleep) {
      suggestions.push("Raat ko proper sleep fix kar - melatonin ya white noise try kar.");
    } else {
      suggestions.push("30-minute rest or meditation session lo.");
    }
    if (mentionedKeywords.food) {
      suggestions.push("Energy boost ke liye ek healthy snack le.");
    } else {
      suggestions.push("Pani pee aur light exercise kar.");
    }
    suggestions.push("Screen time 20 minutes reduce kar.");
  } else if (emotion === "anxious") {
    if (mentionedKeywords.work) {
      suggestions.push("Task ko chhote steps me divide kar deta.");
    } else {
      suggestions.push("4-7-8 breathing technique: 4 count breathe in, 7 hold, 8 breathe out.");
    }
    if (mentionedKeywords.social) {
      suggestions.push("Close friend se quick call karle.");
    } else {
      suggestions.push("Grounding exercise try kar - 5 things dekh, 4 suno, 3 touch, 2 smell, 1 taste.");
    }
    suggestions.push("Journaling me apne thoughts likh.");
  } else if (emotion === "sad") {
    if (mentionedKeywords.social) {
      suggestions.push("Kisi se baat kar - sharing se relief milega.");
    } else {
      suggestions.push("Favorite song lagakar alone time nahi lo, company khoj.");
    }
    if (mentionedKeywords.exercise) {
      suggestions.push("Quick 15-minute walk outdoor ja.");
    } else {
      suggestions.push("Kisi ko help kar - helping others mood lift karte.");
    }
    suggestions.push("Gratitude list banaa - 3 chhoti cheezein likha.");
  } else if (emotion === "angry") {
    if (mentionedKeywords.work) {
      suggestions.push("Situation se distance le - short break ja.");
    } else {
      suggestions.push("Frustration release: cushion punch ya cold water face par daal.");
    }
    if (mentionedKeywords.exercise) {
      suggestions.push("Intense workout ya punching bag use kar.");
    } else {
      suggestions.push("Deep breathing + physical activity - running ya jumping jacks.");
    }
    suggestions.push("Kya galat hua uska reason likh - perspective badal jayega.");
  } else if (emotion === "happy" || emotion === "calm") {
    if (mentionedKeywords.work) {
      suggestions.push("Is momentum ko maintain kar - productive tasks complete kar.");
    } else {
      suggestions.push("Is feeling ko celebrate kar - special kuch kar jo enjoy ho.");
    }
    suggestions.push("Positive mood ko journal me note kar - future ka reminder.");
    suggestions.push("Kisi aur ko share kar - positive energy spread kar.");
  } else {
    // Neutral
    if (mentionedKeywords.work) {
      suggestions.push("Daily tasks complete kar aur progress track kar.");
    } else {
      suggestions.push("Aaj ka ek meaningful activity plan kar.");
    }
    suggestions.push("Mindfulness meditation try kar - 5 minute clarity session.");
    if (mentionedKeywords.food) {
      suggestions.push("Balanced meal le aur hydration track kar.");
    } else {
      suggestions.push("Small goals set kar aur achieve kar - confidence badhega.");
    }
  }

  return suggestions.slice(0, 3);
};

const safeFallback = (voiceNote = "") => {
  const voiceLower = voiceNote.toLowerCase();
  const mentionsTired = /(thak|tired|sleep|neend|exhaust|bahar|worn)/i.test(voiceLower);
  const mentionsStress = /(tension|stress|worried|ghabra|nervou)/i.test(voiceLower);
  const mentionsBad = /(sad|down|depressed|low|gloomy|dukhi)/i.test(voiceLower);
  const mentionsGood = /(happy|great|excited|good|amazing|awesome|khush)/i.test(voiceLower);

  let detectedEmotion = "neutral";
  if (mentionsTired) detectedEmotion = "tired";
  else if (mentionsStress) detectedEmotion = "anxious";
  else if (mentionsBad) detectedEmotion = "sad";
  else if (mentionsGood) detectedEmotion = "happy";

  const fatigueDetected = mentionsTired;

  const wellbeingPrompts = {
    tired: [
      "Rest leto, body ko time do recovery ka.",
      "Thak raha ho? 10-min break lete ho?",
      "Energy low hai, nap ya meditation try kar.",
    ],
    anxious: [
      "Ghabra mat - breathing exercise karte hain?",
      "Concern ke baare me baat kar isse handle hoga.",
      "Present moment me reh - grounding technique try kar.",
    ],
    sad: [
      "Feeling low? Kisi close person se baat kar.",
      "Is moment se bahar aa - activity change kar.",
      "Khud se pyaar kar - kya treat kar sakta hai?",
    ],
    happy: [
      "Feeling great! Ise celebrate aur journal me note kar.",
      "Khush lag rahe ho - iska momentum maintain kar.",
      "Is mood ko share kar sabke saath.",
    ],
    neutral: [
      "Mood stable hai - small goals achieve kar.",
      "Kya meaningful activity kar sakte hain aaj?",
      "Self-care routine follow kar consistency se.",
    ],
  };

  const selectedPrompt =
    wellbeingPrompts[detectedEmotion][Math.floor(Math.random() * wellbeingPrompts[detectedEmotion].length)];

  return {
    detectedEmotion,
    energyLevel: mentionsTired ? "low" : mentionsGood ? "high" : "medium",
    fatigueDetected,
    confidence: 0.45,
    wellbeingPrompt: selectedPrompt,
    supportiveSuggestions: generateContextualSuggestions(detectedEmotion, fatigueDetected, voiceNote),
  };
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

const isGeminiAuthError = (error) => {
  const message = (error?.message || "").toLowerCase();
  return message.includes("403") || message.includes("unregistered callers") || message.includes("api key") || message.includes("forbidden");
};

const isGeminiTemporaryError = (error) => {
  const msg = (error?.message || "").toLowerCase();
  return msg.includes("429") || msg.includes("503") || msg.includes("quota") || msg.includes("too many requests");
};

router.post("/scan", authMiddleware, async (req, res) => {
  try {
    const model = getGeminiModel();
    const userId = req.user?.userId;
    const { imageBase64, framesBase64, voiceNote } = req.body || {};

    const imageFrames = Array.isArray(framesBase64)
      ? framesBase64.filter((item) => typeof item === "string" && item.length > 100).slice(0, 3)
      : [];

    if (imageFrames.length === 0 && typeof imageBase64 === "string" && imageBase64.length > 100) {
      imageFrames.push(imageBase64);
    }

    if (imageFrames.length === 0) {
      return res.status(400).json({ message: "imageBase64 or framesBase64 is required" });
    }

    const fallback = safeFallback(voiceNote || "");

    if (!model) {
      const saved = await MoodScan.create({
        user: userId,
        voiceNote: voiceNote || "",
        imageCaptured: true,
        ...fallback,
        rawResponse: JSON.stringify({ mode: "fallback", reason: "missing_key" }),
      });

      return res.json({ ...fallback, id: saved._id, createdAt: saved.createdAt, source: "fallback-no-ai" });
    }

    const prompt = buildPrompt(voiceNote || "");
    const imageParts = imageFrames.map((frame) => ({
      inlineData: {
        data: frame,
        mimeType: "image/jpeg",
      },
    }));

    const content = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }, ...imageParts],
        },
      ],
      generationConfig: {
        temperature: 0.25,
        responseMimeType: "application/json",
      },
    };

    try {
      const result = await model.generateContent(content);
      const replyText = result?.response?.text?.() || "";
      const parsed = parseJsonFromModel(replyText);

      const detectedEmotion = normalizeEmotion(parsed?.detectedEmotion || fallback.detectedEmotion);
      const fatigueDetected = typeof parsed?.fatigueDetected === "boolean" ? parsed.fatigueDetected : fallback.fatigueDetected;
       
      // Use AI-generated suggestions if available, otherwise use contextual fallback
      const normalized = {
        detectedEmotion,
        energyLevel: normalizeEnergy(parsed?.energyLevel || fallback.energyLevel),
        fatigueDetected,
        confidence: Math.max(0, Math.min(1, Number(parsed?.confidence || fallback.confidence))),
        wellbeingPrompt: parsed?.wellbeingPrompt || fallback.wellbeingPrompt,
        supportiveSuggestions: Array.isArray(parsed?.supportiveSuggestions)
          ? parsed.supportiveSuggestions.slice(0, 3)
          : fallback.supportiveSuggestions,
      };

      const saved = await MoodScan.create({
        user: userId,
        voiceNote: voiceNote || "",
        imageCaptured: true,
        ...normalized,
        rawResponse: replyText,
      });

      return res.json({ ...normalized, id: saved._id, createdAt: saved.createdAt, source: "ai" });
    } catch (aiError) {
      if (!isGeminiAuthError(aiError) && !isGeminiTemporaryError(aiError)) {
        throw aiError;
      }

      const saved = await MoodScan.create({
        user: userId,
        voiceNote: voiceNote || "",
        imageCaptured: true,
        ...fallback,
        rawResponse: String(aiError?.message || "gemini error"),
      });

      return res.json({ ...fallback, id: saved._id, createdAt: saved.createdAt, source: "fallback" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message || "Mood scan failed" });
  }
});

router.get("/history", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const scans = await MoodScan.find({ user: userId }).sort({ createdAt: -1 }).limit(20).lean();
    return res.json(scans);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to load scan history" });
  }
});

module.exports = router;
