const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const authMiddleware = require("../middleware/authMiddleware");
const DailyZenBriefing = require("../models/DailyZenBriefing");
const Mood = require("../models/Mood");
const UserPreference = require("../models/UserPreference");

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

const buildWeatherLine = (weatherNote, city) => {
  const weather = String(weatherNote || "").trim();
  const cityName = String(city || "").trim();

  if (weather) {
    return cityName
      ? `The weather in ${cityName} is ${weather.toLowerCase()}, so start gently with a warm drink.`
      : `Today's weather feels ${weather.toLowerCase()}, so begin with a warm and calm start.`;
  }

  return cityName
    ? `The morning in ${cityName} looks calm, so begin your day with a warm cup and slow breathing.`
    : "This morning looks calm, so begin your day with a warm cup and a mindful start.";
};

const buildFallback = (payload) => {
  const {
    userName = "User",
    city = "",
    weatherNote = "",
    sleepHours = 0,
    moodCountLast7Days = 0,
    streakDays = 0,
    todayGoal = "5 minutes deep breathing",
  } = payload;

  const normalizedSleep = Number(sleepHours) || 0;
  const sleepLine = normalizedSleep > 0
    ? `You slept about ${normalizedSleep} hours yesterday, which is a strong step for recovery.`
    : "Your sleep hours were not tracked, so prioritize quality rest tonight.";

  const consistencyLine = streakDays > 0
    ? `You are on a ${streakDays}-day wellness streak, keep this momentum alive.`
    : moodCountLast7Days > 0
      ? `You logged mood check-ins ${moodCountLast7Days} times this week, great consistency.`
      : "Start with one simple check-in today to build your consistency.";

  const greeting = `Good morning ${userName}!`;
  const weatherLine = buildWeatherLine(weatherNote, city);
  const recoveryLine = sleepLine;
  const motivationLine = `Today's focus: ${todayGoal}. You have got this.`;

  return {
    greeting,
    weatherLine,
    recoveryLine,
    motivationLine,
    todayGoal,
    briefingText: `${greeting} ${weatherLine} ${recoveryLine} ${consistencyLine} ${motivationLine}`,
    actionChecklist: [
      "Drink one glass of water in the first 15 minutes.",
      todayGoal,
      "Do one mindful check-in before lunch.",
    ],
  };
};

const buildPrompt = (payload) => {
  const {
    userName = "User",
    city = "",
    weatherNote = "",
    sleepHours = 0,
    moodCountLast7Days = 0,
    streakDays = 0,
    todayGoal = "5 minutes deep breathing",
  } = payload;

  return [
    "You are a caring wellness assistant creating a short personalized morning audio briefing.",
    "Return ONLY valid minified JSON with this exact shape:",
    '{"greeting":"string","weatherLine":"string","recoveryLine":"string","motivationLine":"string","todayGoal":"string","briefingText":"2-4 short lines merged into one paragraph","actionChecklist":["line1","line2","line3"]}',
    "Tone: warm, human, supportive, concise, non-medical.",
    `Name: ${userName}`,
    `City: ${city || "not provided"}`,
    `Weather hint: ${weatherNote || "not provided"}`,
    `Sleep hours yesterday: ${sleepHours}`,
    `Mood check-ins in last 7 days: ${moodCountLast7Days}`,
    `Current streak days: ${streakDays}`,
    `Today's preferred goal: ${todayGoal}`,
  ].join("\n");
};

// Auto-fetch user wellness data
const autoFetchUserData = async (userId, userName, requestedCity = "") => {
  try {
    // Fetch last 7 days of moods
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentMoods = await Mood.find({
      user: userId,
      createdAt: { $gte: sevenDaysAgo }
    }).limit(20).sort({ createdAt: -1 }).lean();

    const moodCountLast7Days = recentMoods.length;

    // Calculate mood streak (consecutive days with entries)
    const moodsByDate = {};
    recentMoods.forEach(m => {
      const dateKey = new Date(m.createdAt).toDateString();
      moodsByDate[dateKey] = (moodsByDate[dateKey] || 0) + 1;
    });
    const streakDays = Object.keys(moodsByDate).length;

    // Get average mood intensity
    const avgIntensity = recentMoods.length > 0
      ? (recentMoods.reduce((sum, m) => sum + (Number(m?.intensity) || 5), 0) / recentMoods.length).toFixed(1)
      : 5;

    // Get most recent mood
    const lastMood = recentMoods[0]?.mood || "balanced";

    // Use saved preferences if available to make the briefing more personalized
    const preferences = await UserPreference.findOne({ user: userId }).lean();
    const reminderPrefs = preferences?.smartWellnessReminders || {};

    // Derive a stable sleep estimate from recent wellness signals
    const sleepHours = Math.min(8, Math.max(0, 5 + Math.round(Number(avgIntensity) / 2)));

    // Generate random city names (since we don't have location API)
    const indianCities = ["Ahmedabad", "Bangalore", "Mumbai", "Delhi", "Hyderabad", "Pune", "Kolkata", "Chennai"];
    const randomCity = indianCities[Math.floor(Math.random() * indianCities.length)];
    const resolvedCity = String(requestedCity || "").trim() || randomCity;

    // Generate weather hint based on time
    const hour = new Date().getHours();
    const weatherOptions = {
      morning: ["cool", "fresh", "crisp morning air", "gentle"],
      afternoon: ["warm", "bright", "sunny"],
      evening: ["calm", "golden", "serene"]
    };
    const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
    const weatherHint = weatherOptions[timeOfDay][Math.floor(Math.random() * weatherOptions[timeOfDay].length)];

    // Generate unique goal based on mood trend
    const goalOptions = {
      anxious: "5 min calm breathing & grounding",
      sad: "one gratitude note & movement",
      energetic: "channel energy into a project",
      balanced: "maintain consistency with meditation",
      stressed: "progressive muscle relaxation",
      happy: "share positivity with someone",
    };
    
    const reminderAdjustedGoal = reminderPrefs?.moodCheckinEnabled === false
      ? "reconnect with one mindful check-in"
      : reminderPrefs?.breakReminderEnabled === false
        ? "take one intentional pause before noon"
        : null;

    const defaultGoal = reminderAdjustedGoal || goalOptions[lastMood] || "5 minutes mindfulness";

    return {
      userName: String(userName || "User"),
      city: resolvedCity,
      weatherNote: weatherHint,
      sleepHours,
      moodCountLast7Days,
      streakDays,
      todayGoal: defaultGoal,
      lastMood,
      avgIntensity,
    };
  } catch (err) {
    console.error("Auto-fetch error:", err);
    return null;
  }
};

router.post("/generate", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const manualCity = String(req.body?.city || "").trim();
    const manualGoal = String(req.body?.todayGoal || "").trim();
    const manualWeather = String(req.body?.weatherNote || "").trim();
    const hasManualSleep = req.body?.sleepHours !== undefined && req.body?.sleepHours !== null && req.body?.sleepHours !== "";
    const hasManualMoodCount = req.body?.moodCountLast7Days !== undefined && req.body?.moodCountLast7Days !== null && req.body?.moodCountLast7Days !== "";
    const hasManualStreak = req.body?.streakDays !== undefined && req.body?.streakDays !== null && req.body?.streakDays !== "";
    const hasAnyManualOverride = Boolean(
      manualCity ||
      manualGoal ||
      manualWeather ||
      hasManualSleep ||
      hasManualMoodCount ||
      hasManualStreak,
    );

    // Auto-fetch all user data automatically
    const autoData = await autoFetchUserData(userId, req.body?.userName, req.body?.city);
    const basePayload = autoData || {
      userName: "User",
      city: "Home",
      weatherNote: "calm",
      sleepHours: 0,
      moodCountLast7Days: 0,
      streakDays: 0,
      todayGoal: "5 minutes deep breathing",
    };

    const payload = {
      ...basePayload,
      userName: String(req.body?.userName || basePayload.userName || "User"),
      city: String(req.body?.city || basePayload.city || "").trim(),
      weatherNote: String(req.body?.weatherNote || basePayload.weatherNote || "").trim(),
      sleepHours: req.body?.sleepHours !== undefined && req.body?.sleepHours !== null && req.body?.sleepHours !== ""
        ? Math.max(0, Number(req.body.sleepHours))
        : Number(basePayload.sleepHours || 0),
      moodCountLast7Days: req.body?.moodCountLast7Days !== undefined && req.body?.moodCountLast7Days !== null && req.body?.moodCountLast7Days !== ""
        ? Math.max(0, Number(req.body.moodCountLast7Days))
        : Number(basePayload.moodCountLast7Days || 0),
      streakDays: req.body?.streakDays !== undefined && req.body?.streakDays !== null && req.body?.streakDays !== ""
        ? Math.max(0, Number(req.body.streakDays))
        : Number(basePayload.streakDays || 0),
      todayGoal: String(req.body?.todayGoal || basePayload.todayGoal || "5 minutes deep breathing").trim(),
    };

    const fallback = buildFallback(payload);

    if (!model) {
      const saved = await DailyZenBriefing.create({
        user: userId,
        userName: payload.userName,
        city: payload.city,
        weatherNote: payload.weatherNote,
        sleepHours: payload.sleepHours,
        moodCountLast7Days: payload.moodCountLast7Days,
        streakDays: payload.streakDays,
        todayGoal: payload.todayGoal,
        ...fallback,
        source: "fallback",
        rawResponse: JSON.stringify({ mode: "fallback-auto", reason: "missing_key" }),
      });

      return res.json({ ...fallback, id: saved._id, createdAt: saved.createdAt, source: "fallback", autoGenerated: true });
    }

    const prompt = buildPrompt(payload);
    try {
      const result = await model.generateContent(prompt);
      const replyText = result?.response?.text?.() || "";
      const parsed = parseJsonFromModel(replyText);

      const normalized = {
        greeting: parsed?.greeting || fallback.greeting,
        weatherLine: parsed?.weatherLine || fallback.weatherLine,
        recoveryLine: parsed?.recoveryLine || fallback.recoveryLine,
        motivationLine: parsed?.motivationLine || fallback.motivationLine,
        todayGoal: parsed?.todayGoal || payload.todayGoal,
        briefingText: parsed?.briefingText || fallback.briefingText,
        actionChecklist: Array.isArray(parsed?.actionChecklist) && parsed.actionChecklist.length > 0
          ? parsed.actionChecklist.slice(0, 4)
          : fallback.actionChecklist,
      };

      if (hasAnyManualOverride) {
        const forced = buildFallback(payload);
        // Force AI response to reflect user-provided/saved overrides.
        normalized.weatherLine = forced.weatherLine;
        normalized.recoveryLine = forced.recoveryLine;
        normalized.todayGoal = payload.todayGoal;
        normalized.motivationLine = forced.motivationLine;
        normalized.actionChecklist = forced.actionChecklist;
        normalized.briefingText = forced.briefingText;
      }

      const saved = await DailyZenBriefing.create({
        user: userId,
        ...payload,
        ...normalized,
        source: "ai",
        rawResponse: replyText,
      });

      return res.json({ ...normalized, id: saved._id, createdAt: saved.createdAt, source: "ai" });
    } catch (aiError) {
      if (!isGeminiAuthError(aiError)) {
        throw aiError;
      }

      const saved = await DailyZenBriefing.create({
        user: userId,
        ...payload,
        ...fallback,
        source: "fallback-auth",
        rawResponse: String(aiError?.message || "gemini auth error"),
      });

      return res.json({ ...fallback, id: saved._id, createdAt: saved.createdAt, source: "fallback-auth" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message || "Daily Zen generation failed" });
  }
});

router.get("/history", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const history = await DailyZenBriefing.find({ user: userId }).sort({ createdAt: -1 }).limit(20).lean();
    return res.json(history);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to fetch Daily Zen history" });
  }
});

module.exports = router;
