
import React, { useState } from "react";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Brain, CalendarDays, Download, Lightbulb, MessageCircle, Sparkles } from "lucide-react";

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

  const getLocalChats = () => {
    const allChats = JSON.parse(localStorage.getItem("allChatMessages") || "{}");
    if (!userId || !allChats[userId]) return [];
    return allChats[userId].map((item) => ({
      sender: item.sender === "user" ? "user" : "bot",
      text: item.text || "",
      timestamp: formatTimestamp(item.timestamp),
    }));
  };

  const fetchChatsFromBackend = async () => {
    const token = localStorage.getItem("jwtToken");
    if (!token) return [];

    const res = await fetch("/api/chats", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error("Unable to fetch chats from server");
    }

    const chats = await res.json();
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

  const fetchAiSummary = async (messages) => {
    const transcript = messages
      .slice(-16)
      .map((msg) => `${msg.sender === "user" ? "User" : "AI"}: ${msg.text}`)
      .join("\n");

    const prompt = [
      "Summarize this mental wellness conversation in 4 concise bullet points.",
      "Also include one practical self-care suggestion at the end.",
      transcript || "No conversation available.",
    ].join("\n\n");

    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt }),
    });

    if (!res.ok) {
      throw new Error("Unable to generate AI summary");
    }

    const data = await res.json();
    return data.reply || "No AI summary available.";
  };

  const getMoodSummary = () => {
    const allMoodEntries = JSON.parse(localStorage.getItem("allMoodEntries") || "{}");
    if (!userId || !allMoodEntries[userId] || allMoodEntries[userId].length === 0) {
      return "No mood entries found for today.";
    }

    const latest = allMoodEntries[userId][0];
    const mood = latest?.mood || "Unknown";
    const note = latest?.note ? ` Note: ${latest.note}` : "";
    return `Latest mood: ${mood}.${note}`;
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
      const conversationCount = messages.length;
      let aiSummaryText = "Not enough data to generate AI insights.";

      if (messages.length > 0) {
        try {
          aiSummaryText = await fetchAiSummary(messages);
        } catch {
          aiSummaryText = "AI summary unavailable right now. Please try again later.";
        }
      }

      const reportData = {
        userName,
        date: new Date().toLocaleDateString(),
        moodSummary,
        conversationCount,
        aiSummary: aiSummaryText,
        suggestions:
          messages.length > 0
            ? "Maintain a daily check-in routine and continue journaling your emotions."
            : "Start chatting with the assistant to build your daily report insights.",
        messages,
      };

      setReport(reportData);
      if (onReportReady) onReportReady(reportData);
    } catch (err) {
      setError(err?.message || "Report generate nahi ho paayi. Please try again.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    generateReport();
    // eslint-disable-next-line
  }, []);

  // Download PDF
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
    doc.text("Mental Wellness Report", 15, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(`Name: ${report.userName}`, 15, y);
    y += 7;
    doc.text(`Date: ${report.date}`, 15, y);
    y += 10;
    doc.setFontSize(14);
    doc.text("Mood Summary", 15, y);
    y += 8;
    doc.setFontSize(12);
    drawWrappedText(report.moodSummary, 15, 180);
    y += 3;
    doc.setFontSize(14);
    doc.text("Conversations", 15, y);
    y += 8;
    doc.setFontSize(12);
    doc.text(`Total: ${report.conversationCount}`, 15, y);
    y += 7;
    report.messages.slice(0, 10).forEach((msg, i) => {
      drawWrappedText(`${i + 1}. ${msg.timestamp}: ${msg.sender === 'user' ? 'You' : 'AI'}: ${msg.text}`, 15, 180);
    });
    y += 5;
    doc.setFontSize(14);
    doc.text("AI Insights & Suggestions", 15, y);
    y += 8;
    doc.setFontSize(12);
    drawWrappedText(report.aiSummary, 15, 180);
    y += 2;
    drawWrappedText(`Suggestions: ${report.suggestions}`, 15, 180);
    doc.save(`Mental_Wellness_Report_${report.date.replace(/\//g, '-')}.pdf`);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-card to-serenity-soft p-5 shadow-serenity-lg sm:p-7 animate-fade-in">
      <div className="pointer-events-none absolute -left-12 -top-12 h-32 w-32 rounded-full bg-primary/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-14 -right-12 h-36 w-36 rounded-full bg-accent/15 blur-2xl" />

      <div className="relative z-10 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Daily Wellness Digest
            </div>
            <h3 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
              Personal Mental Health Report
            </h3>
            <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
              One click me aaj ka mood, conversation insights aur actionable self-care guidance.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:min-w-[280px] sm:grid-cols-2">
            <Button
              onClick={generateReport}
              disabled={loading}
              className="h-11 bg-gradient-to-r from-primary to-accent font-semibold text-white shadow-serenity transition-all hover:brightness-110"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {loading ? "Generating..." : "Generate"}
            </Button>
            <Button
              onClick={downloadPDF}
              disabled={!report}
              variant="outline"
              className="h-11 border-primary/40 bg-card/80 font-semibold hover:border-primary/70 hover:bg-primary/10"
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>

        {!report && !error && (
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-5 text-sm text-muted-foreground">
            {loading ? "Preparing your report..." : "Generate report par click karke insights dekho."}
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
                  {report.conversationCount}
                </p>
              </div>
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
                <p className="text-sm text-muted-foreground">Abhi koi chat logs nahi mile. Chatbot use karoge to yaha highlights dikhengi.</p>
              ) : (
                <div className="space-y-2">
                  {report.messages.slice(-4).map((msg, index) => (
                    <div
                      key={`${msg.timestamp}-${index}`}
                      className={`rounded-xl px-3 py-2 text-sm ${
                        msg.sender === "user"
                          ? "border border-primary/30 bg-primary/10"
                          : "border border-border bg-muted/40"
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
