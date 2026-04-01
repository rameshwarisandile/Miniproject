const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const MoodScan = require("../models/MoodScan");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();

const GEMINI_API_KEY = process.env.KEY || "";
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-2.5-flash" }) : null;

const buildPrompt = (voiceNote) => [
  "You are an empathetic wellness assistant.",
  "Analyze this user's face image and optional voice note text.",
  "Infer likely emotion and fatigue signs only as a gentle estimate.",
  "Return ONLY valid minified JSON with keys:",
  '{"detectedEmotion":"happy|calm|tired|anxious|sad|angry|neutral","energyLevel":"low|medium|high","fatigueDetected":true/false,"confidence":0.0-1.0,"wellbeingPrompt":"one short Hinglish supportive question","supportiveSuggestions":["short suggestion 1","short suggestion 2","short suggestion 3"]}',
  "Do not provide diagnosis.",
  voiceNote ? `Voice note text from user: ${voiceNote}` : "Voice note text from user: not provided.",
].join("\n");

const buildWellbeingPrompt = (emotion, fatigueDetected) => {
  if (fatigueDetected || emotion === "tired") {
    return "Aapki aankhein thaki hui lag rahi hain, kya thodi der break lena chahenge?";
  }
  if (emotion === "anxious") {
    return "Aap thode anxious lag rahe hain, kya 2 minute deep breathing try karna chahenge?";
  }
  if (emotion === "sad") {
    return "Aap thode low lag rahe hain, kya short walk ya kisi friend se baat karna chahenge?";
  }
  if (emotion === "angry") {
    return "Aap tense lag rahe hain, kya 60-second pause aur slow breathing lena chahenge?";
  }
  if (emotion === "happy" || emotion === "calm") {
    return "Aap ka expression positive lag raha hai, kya is mood ko journal me save karna chahenge?";
  }
  return "Aap kaise feel kar rahe ho abhi, kya quick mood check-in karna chahenge?";
};

const safeFallback = (voiceNote = "") => {
  const mentionsTired = /(thak|tired|sleep|neend|exhaust)/i.test(voiceNote);
  const detectedEmotion = mentionsTired ? "tired" : "neutral";
  const fatigueDetected = mentionsTired;

  return {
    detectedEmotion,
    energyLevel: mentionsTired ? "low" : "medium",
    fatigueDetected,
    confidence: 0.42,
    wellbeingPrompt: buildWellbeingPrompt(detectedEmotion, fatigueDetected),
    supportiveSuggestions: mentionsTired
      ? ["2 minute deep breathing try karein.", "Pani piyein aur short walk karein.", "Screen se 5 minute break lein."]
      : ["Aaj ka mood tracker check-in complete karein.", "Hydration reminder follow karein.", "One gentle task finish karein."],
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

router.post("/scan", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { imageBase64, voiceNote } = req.body || {};

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({ message: "imageBase64 is required" });
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

      return res.json({ ...fallback, id: saved._id, createdAt: saved.createdAt, source: "fallback" });
    }

    const prompt = buildPrompt(voiceNote || "");
    const content = [
      { text: prompt },
      {
        inlineData: {
          data: imageBase64,
          mimeType: "image/jpeg",
        },
      },
    ];

    try {
      const result = await model.generateContent(content);
      const replyText = result?.response?.text?.() || "";
      const parsed = parseJsonFromModel(replyText);

      const detectedEmotion = parsed?.detectedEmotion || fallback.detectedEmotion;
      const fatigueDetected = typeof parsed?.fatigueDetected === "boolean" ? parsed.fatigueDetected : fallback.fatigueDetected;
      const normalized = {
        detectedEmotion,
        energyLevel: parsed?.energyLevel || fallback.energyLevel,
        fatigueDetected,
        confidence: Math.max(0, Math.min(1, Number(parsed?.confidence || fallback.confidence))),
        wellbeingPrompt: buildWellbeingPrompt(detectedEmotion, fatigueDetected),
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
      if (!isGeminiAuthError(aiError)) {
        throw aiError;
      }

      const saved = await MoodScan.create({
        user: userId,
        voiceNote: voiceNote || "",
        imageCaptured: true,
        ...fallback,
        rawResponse: String(aiError?.message || "gemini auth error"),
      });

      return res.json({ ...fallback, id: saved._id, createdAt: saved.createdAt, source: "fallback-auth" });
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
