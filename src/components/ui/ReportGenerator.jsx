import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { apiUrl, parseJsonResponse } from "@/lib/api";
import {
  Brain,
  CalendarDays,
  Download,
  Lightbulb,
  MessageCircle,
  Sparkles,
  ScanFace,
  Palette,
  Salad,
  BellRing,
  HandHeart,
  Sunrise,
} from "lucide-react";

const ReportGenerator = ({ userId, userName, onReportReady }) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  const formatTimestamp = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString();
  };

  const getToken = () => localStorage.getItem("jwtToken");

  const getLocalMapData = (key) => {
    try {
      const allData = JSON.parse(localStorage.getItem(key) || "{}");
      if (!userId || !allData[userId]) return [];
      return Array.isArray(allData[userId]) ? allData[userId] : [];
    } catch {
      return [];
    }
  };

  const getLocalChats = () => {
    const chats = getLocalMapData("allChatMessages");
    return chats.map((item) => ({
      sender: item.sender === "user" ? "user" : "bot",
      text: item.text || "",
      timestamp: formatTimestamp(item.timestamp),
    }));
  };

  const fetchJsonWithAuth = async (path, fallbackValue = []) => {
    const token = getToken();
    if (!token) return fallbackValue;

    try {
      const response = await fetch(apiUrl(path), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) return fallbackValue;
      const data = await parseJsonResponse(response, `Unable to parse ${path} response`);
      return data;
    } catch {
      return fallbackValue;
    }
  };

  const fetchChatsFromBackend = async () => {
    const token = getToken();
    if (!token) return [];

    const response = await fetch(apiUrl("/api/chats"), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Unable to fetch chats from server");
    }

    const chats = await parseJsonResponse(response, "Unable to parse chats response");
    const flattened = [];

    chats.forEach((chat) => {
      if (chat.message) {
        flattened.push({
          sender: "user",
          text: chat.message,
          timestamp: formatTimestamp(chat.createdAt),
        });
      }
      if (chat.reply) {
        flattened.push({
          sender: "bot",
          text: chat.reply,
          timestamp: formatTimestamp(chat.updatedAt || chat.createdAt),
        });
      }
    });

    return flattened.reverse();
  };

  const getMoodSummary = () => {
    const moodEntries = getLocalMapData("allMoodEntries");
    if (moodEntries.length === 0) {
      return {
        text: "No mood entries found.",
        count: 0,
      };
    }

    const latest = moodEntries[0] || {};
    const mood = latest.mood || "Unknown";
    const note = latest.note ? ` Note: ${latest.note}` : "";

    return {
      text: `Latest mood: ${mood}.${note}`,
      count: moodEntries.length,
    };
  };

  const buildFeatureSnapshotText = (reportData) => {
    const scannerText = reportData.latestScanner
      ? `${reportData.latestScanner.detectedEmotion || "Unknown"} (${reportData.latestScanner.energyLevel || "-"} energy)`
      : "No scanner data";

    const artText = reportData.latestArt
      ? `${reportData.latestArt.title || "Untitled"} - ${reportData.latestArt.moodSummary || ""}`
      : "No art data";

    const mindGutText = reportData.latestMindGut
      ? `${reportData.latestMindGut.moodLabel || "Mood"} - ${reportData.latestMindGut.suggestionSummary || ""}`
      : "No mind-gut data";

    const dailyZenText = reportData.latestDailyZen
      ? `${reportData.latestDailyZen.greeting || "Good morning"} - ${reportData.latestDailyZen.todayGoal || "No goal"}`
      : "No daily zen data";

    const reminderEnabledCount = [
      reportData.preferences?.smartWellnessReminders?.drinkWaterEnabled,
      reportData.preferences?.smartWellnessReminders?.sleepRoutineEnabled,
      reportData.preferences?.smartWellnessReminders?.breakReminderEnabled,
      reportData.preferences?.smartWellnessReminders?.moodCheckinEnabled,
    ].filter(Boolean).length;

    const socialEnabledCount = [
      reportData.preferences?.humanSocialInteraction?.dailyGreetingsEnabled,
      reportData.preferences?.humanSocialInteraction?.mealCheckEnabled,
      reportData.preferences?.humanSocialInteraction?.eventWishesEnabled,
      reportData.preferences?.humanSocialInteraction?.achievementCelebrationEnabled,
    ].filter(Boolean).length;

    return [
      `Mood Scanner: ${scannerText}`,
      `Mood-to-Art: ${artText}`,
      `Mind-Gut: ${mindGutText}`,
      `Daily Zen: ${dailyZenText}`,
      `Smart Reminders enabled: ${reminderEnabledCount}/4`,
      `Human-like social enabled: ${socialEnabledCount}/4`,
      `Engagement logs captured: ${reportData.featureCounts.engagementLogs}`,
    ].join("\n");
  };

  const fetchAiSummary = async (messages, reportData) => {
    const transcript = messages
      .slice(-16)
      .map((msg) => `${msg.sender === "user" ? "User" : "AI"}: ${msg.text}`)
      .join("\n");

    const prompt = [
      "Create a concise wellness report summary.",
      "Return 5 bullet points in plain text and then one 'Next best action' line.",
      "Use this feature snapshot:",
      buildFeatureSnapshotText(reportData),
      "Conversation snippet:",
      transcript || "No conversation available.",
    ].join("\n\n");

    const response = await fetch(apiUrl("/api/ask"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt }),
    });

    if (!response.ok) {
      throw new Error("Unable to generate AI summary");
    }

    const data = await parseJsonResponse(response, "Unable to parse AI summary response");
    return data.reply || "No AI summary available.";
  };

  const generateReport = async () => {
    setLoading(true);
    setError("");

    try {
      let messages = [];

      try {
        messages = await fetchChatsFromBackend();
      } catch {
        messages = [];
      }

      if (messages.length === 0) {
        messages = getLocalChats();
      }

      const moodSummary = getMoodSummary();
      const journalEntries = getLocalMapData("allWellnessJournal");

      const [preferences, scannerHistory, artHistory, mindGutHistory, dailyZenHistory, engagementHistory] = await Promise.all([
        fetchJsonWithAuth("/api/preferences", {}),
        fetchJsonWithAuth("/api/mood-scanner/history", []),
        fetchJsonWithAuth("/api/mood-art/history", []),
        fetchJsonWithAuth("/api/mind-gut/history", []),
        fetchJsonWithAuth("/api/daily-zen/history", []),
        fetchJsonWithAuth("/api/engagement/history", []),
      ]);

      const featureCounts = {
        moodEntries: moodSummary.count,
        conversationCount: messages.length,
        journalEntries: journalEntries.length,
        scannerScans: Array.isArray(scannerHistory) ? scannerHistory.length : 0,
        artGenerations: Array.isArray(artHistory) ? artHistory.length : 0,
        mindGutSuggestions: Array.isArray(mindGutHistory) ? mindGutHistory.length : 0,
        dailyZenBriefings: Array.isArray(dailyZenHistory) ? dailyZenHistory.length : 0,
        engagementLogs: Array.isArray(engagementHistory) ? engagementHistory.length : 0,
      };

      const reportData = {
        userName,
        date: new Date().toLocaleDateString(),
        moodSummary: moodSummary.text,
        messages,
        preferences,
        scannerHistory: Array.isArray(scannerHistory) ? scannerHistory : [],
        artHistory: Array.isArray(artHistory) ? artHistory : [],
        mindGutHistory: Array.isArray(mindGutHistory) ? mindGutHistory : [],
        dailyZenHistory: Array.isArray(dailyZenHistory) ? dailyZenHistory : [],
        engagementHistory: Array.isArray(engagementHistory) ? engagementHistory : [],
        latestScanner: Array.isArray(scannerHistory) && scannerHistory.length > 0 ? scannerHistory[0] : null,
        latestArt: Array.isArray(artHistory) && artHistory.length > 0 ? artHistory[0] : null,
        latestMindGut: Array.isArray(mindGutHistory) && mindGutHistory.length > 0 ? mindGutHistory[0] : null,
        latestDailyZen: Array.isArray(dailyZenHistory) && dailyZenHistory.length > 0 ? dailyZenHistory[0] : null,
        featureCounts,
      };

      let aiSummaryText = "Not enough data to generate AI insights yet.";
      try {
        aiSummaryText = await fetchAiSummary(messages, reportData);
      } catch {
        aiSummaryText = "AI summary unavailable right now. Please try again later.";
      }

      reportData.aiSummary = aiSummaryText;
      reportData.suggestions =
        featureCounts.conversationCount > 0
          ? "Keep daily check-ins active, use scanner once daily, and apply one Mind-Gut food plan today."
          : "Start with one mood check-in and one Mind-Gut suggestion to build your daily insight baseline.";

      setReport(reportData);
      if (onReportReady) onReportReady(reportData);
    } catch (err) {
      setError(err?.message || "Unable to generate report. Please try again.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const downloadPDF = () => {
    if (!report) return;

    const doc = new jsPDF();
    let y = 15;

    const drawWrappedText = (text, x, maxWidth, step = 7) => {
      const lines = doc.splitTextToSize(text || "-", maxWidth);
      lines.forEach((line) => {
        if (y > 270) {
          doc.addPage();
          y = 15;
        }
        doc.text(line, x, y);
        y += step;
      });
    };

    doc.setFontSize(18);
    doc.text("Mental Wellness Feature Report", 15, y);
    y += 10;

    doc.setFontSize(12);
    doc.text(`Name: ${report.userName}`, 15, y);
    y += 7;
    doc.text(`Date: ${report.date}`, 15, y);
    y += 10;

    doc.setFontSize(14);
    doc.text("Core Summary", 15, y);
    y += 8;
    doc.setFontSize(12);
    drawWrappedText(report.moodSummary, 15, 180);

    y += 3;
    doc.setFontSize(14);
    doc.text("Feature Activity", 15, y);
    y += 8;
    doc.setFontSize(12);
    drawWrappedText(`Mood entries: ${report.featureCounts.moodEntries}`, 15, 180);
    drawWrappedText(`Conversations: ${report.featureCounts.conversationCount}`, 15, 180);
    drawWrappedText(`Journal entries: ${report.featureCounts.journalEntries}`, 15, 180);
    drawWrappedText(`Mood scanner scans: ${report.featureCounts.scannerScans}`, 15, 180);
    drawWrappedText(`Mood-to-Art generations: ${report.featureCounts.artGenerations}`, 15, 180);
    drawWrappedText(`Mind-Gut plans: ${report.featureCounts.mindGutSuggestions}`, 15, 180);
    drawWrappedText(`Daily Zen briefings: ${report.featureCounts.dailyZenBriefings}`, 15, 180);
    drawWrappedText(`Engagement logs: ${report.featureCounts.engagementLogs}`, 15, 180);

    y += 3;
    doc.setFontSize(14);
    doc.text("Latest Feature Highlights", 15, y);
    y += 8;
    doc.setFontSize(12);
    drawWrappedText(
      report.latestScanner
        ? `Mood Scanner: emotion ${report.latestScanner.detectedEmotion || "-"}, energy ${report.latestScanner.energyLevel || "-"}, prompt: ${report.latestScanner.wellbeingPrompt || "-"}`
        : "Mood Scanner: no data",
      15,
      180,
    );
    drawWrappedText(
      report.latestArt
        ? `Mood-to-Art: ${report.latestArt.title || "Untitled"} | ${report.latestArt.moodSummary || "-"}`
        : "Mood-to-Art: no data",
      15,
      180,
    );
    drawWrappedText(
      report.latestMindGut
        ? `Mind-Gut: ${report.latestMindGut.moodLabel || "-"} | ${report.latestMindGut.suggestionSummary || "-"}`
        : "Mind-Gut: no data",
      15,
      180,
    );
    drawWrappedText(
      report.latestDailyZen
        ? `Daily Zen: ${report.latestDailyZen.greeting || "-"} | Goal: ${report.latestDailyZen.todayGoal || "-"}`
        : "Daily Zen: no data",
      15,
      180,
    );

    y += 3;
    doc.setFontSize(14);
    doc.text("Preferences Snapshot", 15, y);
    y += 8;
    doc.setFontSize(12);
    const reminders = report.preferences?.smartWellnessReminders || {};
    const social = report.preferences?.humanSocialInteraction || {};
    drawWrappedText(`Smart reminders enabled: ${Object.values(reminders).filter((v) => v === true).length}`, 15, 180);
    drawWrappedText(`Social interaction features enabled: ${Object.values(social).filter((v) => v === true).length}`, 15, 180);

    y += 3;
    doc.setFontSize(14);
    doc.text("AI Insights & Action", 15, y);
    y += 8;
    doc.setFontSize(12);
    drawWrappedText(report.aiSummary, 15, 180);
    y += 2;
    drawWrappedText(`Suggested action: ${report.suggestions}`, 15, 180);

    doc.save(`Mental_Wellness_Report_${report.date.replace(/\//g, "-")}.pdf`);
  };

  const featureCards = report
    ? [
        { label: "Mood Entries", value: report.featureCounts.moodEntries, Icon: Sparkles },
        { label: "Conversations", value: report.featureCounts.conversationCount, Icon: MessageCircle },
        { label: "Scanner Scans", value: report.featureCounts.scannerScans, Icon: ScanFace },
        { label: "Mood-to-Art", value: report.featureCounts.artGenerations, Icon: Palette },
        { label: "Mind-Gut Plans", value: report.featureCounts.mindGutSuggestions, Icon: Salad },
        { label: "Daily Zen", value: report.featureCounts.dailyZenBriefings, Icon: Sunrise },
        { label: "Reminder Logs", value: report.featureCounts.engagementLogs, Icon: BellRing },
      ]
    : [];

  const reminders = report?.preferences?.smartWellnessReminders || {};
  const social = report?.preferences?.humanSocialInteraction || {};

  return (
    <div className="relative rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-card to-serenity-soft p-5 shadow-serenity-lg sm:p-7 animate-fade-in">
      <div className="pointer-events-none absolute -left-12 -top-12 h-32 w-32 rounded-full bg-primary/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-14 -right-12 h-36 w-36 rounded-full bg-accent/15 blur-2xl" />

      <div className="relative z-10 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Daily Wellness Digest
            </div>
            <h3 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">Personal Mental Health Report</h3>
            <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
              Includes all newly added features: Mood Scanner, Mood-to-Art, Mind-Gut, Daily Zen, smart reminders, and social interaction.
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-3 md:min-w-[320px] md:grid-cols-2">
            <Button
              onClick={generateReport}
              disabled={loading}
              className="h-11 w-full whitespace-nowrap bg-gradient-to-r from-primary to-accent font-semibold text-white shadow-serenity transition-all hover:brightness-110"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {loading ? "Generating..." : "Generate"}
            </Button>
            <Button
              onClick={downloadPDF}
              disabled={!report}
              variant="outline"
              className="h-11 w-full whitespace-nowrap border-primary/40 bg-card/80 font-semibold hover:border-primary/70 hover:bg-primary/10"
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>

        {!report && !error && (
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-5 text-sm text-muted-foreground">
            {loading ? "Preparing your report..." : "Click Generate to load your latest report."}
          </div>
        )}

        {error && <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

        {report && (
          <div className="space-y-4 animate-slide-up">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-card/70 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Name</p>
                <p className="mt-1 text-base font-semibold text-foreground">{report.userName}</p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card/70 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Date</p>
                <p className="mt-1 flex items-center gap-2 text-base font-semibold text-foreground">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  {report.date}
                </p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card/70 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Conversations</p>
                <p className="mt-1 flex items-center gap-2 text-base font-semibold text-foreground">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  {report.featureCounts.conversationCount}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {featureCards.map(({ label, value, Icon }) => (
                <div key={label} className="rounded-2xl border border-border/70 bg-card/70 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-foreground">
                    <Icon className="h-4 w-4 text-primary" />
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/15 to-transparent p-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">Mood Summary</p>
                <p className="text-sm leading-7 text-foreground sm:text-base">{report.moodSummary}</p>
              </div>

              <div className="rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/15 to-transparent p-5">
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent-foreground/90">
                  <Brain className="h-4 w-4" />
                  AI Insights
                </p>
                <p className="text-sm leading-7 text-foreground sm:text-base whitespace-pre-line">{report.aiSummary}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-border/70 bg-card/60 p-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Latest Mood Scanner</p>
                {report.latestScanner ? (
                  <>
                    <p className="text-sm font-semibold text-foreground">Emotion: {report.latestScanner.detectedEmotion || "-"}</p>
                    <p className="text-sm text-muted-foreground">Energy: {report.latestScanner.energyLevel || "-"}</p>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-3">{report.latestScanner.wellbeingPrompt || "-"}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No scanner data yet.</p>
                )}
              </div>

              <div className="rounded-2xl border border-border/70 bg-card/60 p-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Latest Mood-to-Art</p>
                {report.latestArt ? (
                  <>
                    <p className="text-sm font-semibold text-foreground">{report.latestArt.title || "Untitled"}</p>
                    <p className="text-xs text-muted-foreground line-clamp-3">{report.latestArt.moodSummary || "-"}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No mood-art generation yet.</p>
                )}
              </div>

              <div className="rounded-2xl border border-border/70 bg-card/60 p-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Latest Mind-Gut Plan</p>
                {report.latestMindGut ? (
                  <>
                    <p className="text-sm font-semibold text-foreground">Mood: {report.latestMindGut.moodLabel || "-"}</p>
                    <p className="text-xs text-muted-foreground line-clamp-3">{report.latestMindGut.suggestionSummary || "-"}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No mind-gut recommendation yet.</p>
                )}
              </div>

              <div className="rounded-2xl border border-border/70 bg-card/60 p-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Latest Daily Zen</p>
                {report.latestDailyZen ? (
                  <>
                    <p className="text-sm font-semibold text-foreground line-clamp-2">{report.latestDailyZen.greeting || "Good morning"}</p>
                    <p className="text-sm text-muted-foreground">Goal: {report.latestDailyZen.todayGoal || "-"}</p>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-3">{report.latestDailyZen.motivationLine || report.latestDailyZen.briefingText || "-"}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No daily zen briefing yet.</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-indigo-300/25 bg-gradient-to-br from-indigo-200/10 to-transparent p-5">
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-300">
                  <BellRing className="h-4 w-4" />
                  Smart Reminder Settings
                </p>
                <p className="text-sm text-foreground">Drink Water: {reminders.drinkWaterEnabled ? "On" : "Off"}</p>
                <p className="text-sm text-foreground">Sleep Routine: {reminders.sleepRoutineEnabled ? "On" : "Off"}</p>
                <p className="text-sm text-foreground">Break Reminder: {reminders.breakReminderEnabled ? "On" : "Off"}</p>
                <p className="text-sm text-foreground">Mood Check-in: {reminders.moodCheckinEnabled ? "On" : "Off"}</p>
              </div>

              <div className="rounded-2xl border border-teal-300/25 bg-gradient-to-br from-teal-200/10 to-transparent p-5">
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-teal-300">
                  <HandHeart className="h-4 w-4" />
                  Social Interaction Settings
                </p>
                <p className="text-sm text-foreground">Daily Greeting: {social.dailyGreetingsEnabled ? "On" : "Off"}</p>
                <p className="text-sm text-foreground">Meal Check: {social.mealCheckEnabled ? "On" : "Off"}</p>
                <p className="text-sm text-foreground">Event Wishes: {social.eventWishesEnabled ? "On" : "Off"}</p>
                <p className="text-sm text-foreground">Achievement Celebration: {social.achievementCelebrationEnabled ? "On" : "Off"}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-400/10 to-transparent p-5">
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-300">
                <Lightbulb className="h-4 w-4" />
                Suggested Action
              </p>
              <p className="text-sm leading-7 text-foreground sm:text-base">{report.suggestions}</p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card/60 p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent Conversation Preview</p>
              {report.messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No chat logs found yet. Use the assistant to enrich report insights.</p>
              ) : (
                <div className="space-y-2">
                  {report.messages.slice(-4).map((msg, index) => (
                    <div
                      key={`${msg.timestamp}-${index}`}
                      className={`rounded-xl px-3 py-2 text-sm ${
                        msg.sender === "user" ? "border border-primary/30 bg-primary/10" : "border border-border bg-muted/40"
                      }`}
                    >
                      <p className="font-medium text-foreground">{msg.sender === "user" ? "You" : "AI Assistant"}</p>
                      <p className="mt-0.5 text-muted-foreground">{msg.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportGenerator;
