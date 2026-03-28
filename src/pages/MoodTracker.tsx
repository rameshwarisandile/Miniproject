import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Heart } from "lucide-react";

interface MoodEntry {
  id: string;
  mood: string;
  intensity: number;
  note: string;
  date: string;
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

const MoodTracker = () => {
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [intensity, setIntensity] = useState<number>(5);
  const [note, setNote] = useState<string>("");
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const navigate = useNavigate();

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
        await fetch("/api/moods", {
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
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-serenity-calm/20 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center space-x-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="flex items-center space-x-2 bg-transparent hover:bg-[#d946ef] active:bg-[#a21caf] text-[#d946ef] hover:text-white active:text-white font-bold rounded-xl px-6 py-3 shadow transition-all" style={{border: 'none'}}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span>Dashboard</span>
            </Button>
          </Link>
          <h1 className="text-2xl font-bold bg-serenity-gradient bg-clip-text text-transparent">
            Mood Tracker
          </h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
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
                    onClick={() => setSelectedMood(mood.name)}
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