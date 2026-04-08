import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Save, Heart, Lightbulb, Sparkles } from "lucide-react";
import { apiUrl } from "@/lib/api";
import FeatureNavbar from "@/components/ui/FeatureNavbar";

interface MoodEntry {
  id: string;
  mood: string;
  intensity: number;
  note: string;
  date: string;
  aiSuggestions?: string[];
}

const moodOptions = [
  { name: "Happy", emoji: "😊", color: "bg-yellow-100 border-yellow-300 hover:bg-yellow-200" },
  { name: "Calm", emoji: "😌", color: "bg-blue-100 border-blue-300 hover:bg-blue-200" },
  { name: "Excited", emoji: "🤩", color: "bg-orange-100 border-orange-300 hover:bg-orange-200" },
  { name: "Anxious", emoji: "😰", color: "bg-red-100 border-red-300 hover:bg-red-200" },
  { name: "Sad", emoji: "😢", color: "bg-gray-100 border-gray-300 hover:bg-gray-200" },
  { name: "Angry", emoji: "😠", color: "bg-red-200 border-red-400 hover:bg-red-300" },
  { name: "Tired", emoji: "😴", color: "bg-purple-100 border-purple-300 hover:bg-purple-200" },
  { name: "Grateful", emoji: "🙏", color: "bg-green-100 border-green-300 hover:bg-green-200" },
];

const moodSuggestions: Record<string, string[]> = {
  Happy: [
    "Is positive moment ko journal me note karo taaki difficult days me read kar sako.",
    "Aaj kisi ek person ko thank-you message bhejo.",
    "Is energy ko use karke 10 minute walk ya light activity karo.",
  ],
  Calm: [
    "2 minute deep breathing continue rakho to maintain this calm state.",
    "Screen break lo aur pani piyo for better mental clarity.",
    "Aaj ka ek small goal set karke complete karo for momentum.",
  ],
  Excited: [
    "Excitement ko direction do: next 30 minutes ka mini-plan banao.",
    "Apne idea ke 3 action steps likh lo before mood shifts.",
    "Energy high hai, ek creative task pick karo.",
  ],
  Anxious: [
    "5-4-3-2-1 grounding try karo: 5 cheeze dekho, 4 touch karo, 3 suno.",
    "4 second inhale, 4 hold, 6 exhale - 6 rounds karo.",
    "Jo worry hai usko likho aur ek next small action identify karo.",
  ],
  Sad: [
    "Aaj bas one gentle task choose karo, full productivity pressure mat lo.",
    "Sunlight ya fresh air me 10 minute spend karo.",
    "Kisi trusted friend/family ko short message bhej do.",
  ],
  Angry: [
    "React karne se pehle 90 seconds pause lo aur slow breathing karo.",
    "Physical reset: 20 squats ya brisk walk for energy release.",
    "Trigger likho: kya hua, kaisa feel hua, next better response kya hoga.",
  ],
  Tired: [
    "Hydration + 5 minute stretch se quick refresh lo.",
    "Aaj high-priority ke sirf 1-2 tasks karo.",
    "Aaj raat sleep timing 30 min early rakhne ki planning karo.",
  ],
  Grateful: [
    "Aaj ke gratitude points ko journal me 3 lines me likho.",
    "Jis cheez ke liye grateful ho, us person ko appreciation bhejo.",
    "Is feeling ko maintain karne ke liye ek mindful pause lo.",
  ],
};

const MoodTracker = () => {
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [intensity, setIntensity] = useState<number>(5);
  const [note, setNote] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>("");
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [expandedSuggestionEntries, setExpandedSuggestionEntries] = useState<string[]>([]);

  const getSuggestionsForMood = () => {
    const selected = moodSuggestions[selectedMood] || [];
    if (selectedMood === "Anxious" && intensity >= 8) {
      return [
        "Intensity high lag rahi hai. 2 minute slow breathing abhi karo.",
        "Agar overwhelming feel ho raha hai, kisi trusted person ko call/text karo.",
        ...selected,
      ];
    }
    return selected;
  };

  const fetchAiSuggestions = async () => {
    if (!selectedMood) return;

    setAiLoading(true);
    setAiError("");

    try {
      const prompt = `You are a compassionate mental wellness assistant. User mood: ${selectedMood}. Intensity: ${intensity}/10. Note: ${note || "No note provided"}. Provide 4 short, practical, safe suggestions in simple Hinglish. Keep each suggestion under 18 words. Avoid diagnosis and avoid harmful advice. Return as numbered list only.`;

      const response = await fetch(apiUrl("/api/ask"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: prompt }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch AI suggestions");
      }

      const data = await response.json();
      const replyText = (data?.reply || "").toString();

      // Parse suggestions from response
      const parsed = replyText
        .split("\n")
        .map((line: string) => line.replace(/^\s*(\d+[.)]|[-*])\s*/, "").trim())
        .filter((line: string) => line.length > 0)
        .slice(0, 4);

      if (parsed.length === 0) {
        // If no suggestions parsed, fall back to local suggestions
        console.log("No parsed suggestions, using local fallback");
        setAiSuggestions(getSuggestionsForMood());
        setAiError("");
      } else {
        setAiSuggestions(parsed);
        setAiError("");
      }
    } catch (error) {
      console.error("Error fetching AI suggestions:", error);
      // On error, fall back to local mood suggestions
      setAiSuggestions(getSuggestionsForMood());
      setAiError("Local mood guidance dikhaya ja raha hai (AI temporarily unavailable).");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    // Auto-fetch AI suggestions when suggestion panel opens and mood is selected
    if (showSuggestions && selectedMood && aiSuggestions.length === 0) {
      const timeoutId = window.setTimeout(() => {
        console.log("Auto-fetching AI suggestions for mood:", selectedMood);
        fetchAiSuggestions();
      }, 300); // Small delay to ensure smooth UX
      return () => window.clearTimeout(timeoutId);
    }
  }, [showSuggestions, selectedMood]);

  useEffect(() => {
    // Load only current user's moods
    const loggedInUser = JSON.parse(localStorage.getItem("backendUser") || '{}');
    const userId = loggedInUser?.id || loggedInUser?._id || null;
    let allEntries = JSON.parse(localStorage.getItem("allMoodEntries") || '{}');
    if (userId && allEntries[userId]) {
      setEntries(allEntries[userId]);
    } else {
      setEntries([]);
    }
  }, [localStorage.getItem("backendUser")]);

  const handleSave = async () => {
    if (!selectedMood) {
      alert("Please select a mood first!");
      return;
    }
    const newEntry: MoodEntry = {
      id: Date.now().toString(),
      mood: selectedMood,
      intensity,
      note,
      date: new Date().toISOString(),
      aiSuggestions: aiSuggestions,
    };
    // LocalStorage: user-specific
    const loggedInUser = JSON.parse(localStorage.getItem("backendUser") || '{}');
    const userId = loggedInUser?.id || loggedInUser?._id || null;
    let allEntries = JSON.parse(localStorage.getItem("allMoodEntries") || '{}');
    if (!userId) {
      alert("User not found. Please login again.");
      return;
    }
    if (!allEntries[userId]) allEntries[userId] = [];
    allEntries[userId] = [newEntry, ...allEntries[userId]];
    localStorage.setItem("allMoodEntries", JSON.stringify(allEntries));
    setEntries(allEntries[userId]);
    // --- Backend ---
    try {
      const token = localStorage.getItem("jwtToken");
      if (token) {
        await fetch(apiUrl("/api/moods"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ mood: selectedMood, note }),
        });
      }
    } catch (err) {
      // Optionally: show backend error
    }
    // Reset form
    setSelectedMood("");
    setIntensity(5);
    setNote("");
    setShowSuggestions(false);
    setAiSuggestions([]);
    setAiError("");
    alert("Mood entry saved successfully!");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-serenity-soft">
      <FeatureNavbar featureName="😊 Mood Tracker" />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 page-hero-shell text-center">
          <h1 className="page-hero-title text-gradient-primary mb-3">Mood Tracker</h1>
          <p className="page-hero-subtitle max-w-2xl mx-auto">Capture your daily emotions and understand your wellness patterns over time.</p>
        </div>

        {/* Current Mood Entry */}
        <Card className="card-elevated mb-8 shadow-serenity-lg animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 text-3xl font-bold">
              <div className="p-2 bg-serenity-gradient rounded-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="text-gradient-primary">How are you feeling?</span>
            </CardTitle>
            <CardDescription className="text-base mt-3">
              Take a moment to check in with yourself. Your feelings are valid and tracking them helps you understand your patterns.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Mood Selection */}
            <div>
              <label className="label-enhanced mb-5 block">Select Your Mood</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {moodOptions.map((mood) => (
                  <Button
                    key={mood.name}
                    variant={selectedMood === mood.name ? "default" : "outline"}
                    className={`h-24 flex-col space-y-2 transition-all duration-300 border-2 font-semibold ${
                      selectedMood === mood.name
                        ? "bg-primary text-primary-foreground shadow-serenity-lg scale-105"
                        : mood.color + " hover:border-primary"
                    }`}
                    onClick={() => {
                      setSelectedMood(mood.name);
                      setShowSuggestions(false);
                      setAiSuggestions([]);
                      setAiError("");
                    }}
                  >
                    <span className="text-3xl">{mood.emoji}</span>
                    <span className="text-xs font-semibold">{mood.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Intensity Scale */}
            {selectedMood && (
              <div className="animate-slide-up space-y-4 p-6 bg-serenity-soft/50 rounded-xl border border-serenity-calm/30">
                <div>
                  <h3 className="label-enhanced mb-4 flex justify-between">
                    <span>Intensity Level</span>
                    <span className="text-primary text-lg font-bold">{intensity}/10</span>
                  </h3>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-xs font-semibold text-muted-foreground">MILD</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={intensity}
                    onChange={(e) => setIntensity(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gradient-to-r from-serenity-calm to-primary rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-xs font-semibold text-muted-foreground">INTENSE</span>
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedMood && (
              <div className="animate-slide-up delay-100 space-y-3">
                <label className="label-enhanced block">What's On Your Mind?</label>
                <Textarea
                  placeholder="Describe what you're feeling, what triggered this mood, or anything else you'd like to remember... (optional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  className="input-focus-glow rounded-xl p-4 bg-background border-2 border-serenity-calm/30 transition-all duration-300"
                />
              </div>
            )}

            {/* Suggestions */}
            {selectedMood && (
              <div className="animate-slide-up delay-150 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-serenity-calm/30 bg-serenity-soft/50 p-4">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-foreground">Need suggestions for this mood?</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSuggestions((prev) => !prev)}
                    className="border-primary/40 hover:border-primary"
                  >
                    {showSuggestions ? "Hide Suggestions" : "Show Suggestions"}
                  </Button>
                </div>

                {showSuggestions && (
                  <div className="rounded-xl border border-primary/25 bg-background/90 p-4">
                    <h4 className="mb-3 text-sm font-bold text-primary">Suggestions for {selectedMood}</h4>
                    <ul className="space-y-2">
                      {getSuggestionsForMood().map((tip, idx) => (
                        <li key={`${selectedMood}-tip-${idx}`} className="rounded-lg bg-serenity-soft/60 px-3 py-2 text-sm text-foreground">
                          {tip}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-4 border-t border-serenity-calm/30 pt-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <h5 className="flex items-center gap-2 text-sm font-bold text-primary">
                          <Sparkles className="h-4 w-4" />
                          AI Suggestions
                        </h5>
                        <Button
                          type="button"
                          size="sm"
                          onClick={fetchAiSuggestions}
                          disabled={aiLoading}
                          className="px-4"
                        >
                          {aiLoading ? "Thinking..." : "Get AI Suggestions"}
                        </Button>
                      </div>

                      {aiError && (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{aiError}</p>
                      )}

                      {aiSuggestions.length > 0 && (
                        <ul className="mt-3 space-y-2">
                          {aiSuggestions.map((tip, idx) => (
                            <li key={`ai-tip-${idx}`} className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-foreground">
                              {tip}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Save Button */}
            {selectedMood && (
              <div className="flex justify-center animate-slide-up delay-200 pt-4">
                <Button 
                  onClick={handleSave}
                  size="lg"
                  className="btn-primary-enhanced px-12 py-3 rounded-xl flex items-center space-x-3 text-base font-semibold"
                >
                  <Save className="w-5 h-5" />
                  <span>Save Entry</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Entries */}
        {entries.length > 0 && (
          <Card className="card-elevated animate-slide-up delay-300">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gradient-primary">Recent Mood History</CardTitle>
              <CardDescription className="text-base">
                Track your emotional patterns and discover your wellness trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {entries.slice(0, 10).map((entry, idx) => {
                  const moodOption = moodOptions.find(m => m.name === entry.mood);
                  const isExpanded = expandedSuggestionEntries.includes(entry.id);
                  return (
                    <div
                      key={entry.id}
                      className="group p-4 rounded-xl bg-gradient-to-r from-serenity-soft/70 to-serenity-soft/30 border border-serenity-calm/40 hover:border-primary/50 transition-all duration-300 hover:shadow-serenity-md"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="text-3xl mt-1">{moodOption?.emoji}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-bold text-lg text-foreground">{entry.mood}</span>
                              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/20 text-primary">
                                {entry.intensity}/10
                              </span>
                            </div>
                            {entry.note && (
                              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{entry.note}</p>
                            )}
                            {entry.aiSuggestions && entry.aiSuggestions.length > 0 && (
                              <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">Saved AI Suggestions</p>
                                <ul className="space-y-1.5">
                                  {(isExpanded ? entry.aiSuggestions : entry.aiSuggestions.slice(0, 2)).map((tip, tipIndex) => (
                                    <li key={`${entry.id}-ai-${tipIndex}`} className="text-xs text-foreground/90">
                                      {tip}
                                    </li>
                                  ))}
                                </ul>
                                {entry.aiSuggestions.length > 2 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="mt-2 h-7 px-2 text-xs text-primary hover:text-primary"
                                    onClick={() =>
                                      setExpandedSuggestionEntries((prev) =>
                                        prev.includes(entry.id)
                                          ? prev.filter((id) => id !== entry.id)
                                          : [...prev, entry.id],
                                      )
                                    }
                                  >
                                    {isExpanded ? "Show less" : `View all (${entry.aiSuggestions.length})`}
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                          {formatDate(entry.date)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MoodTracker;