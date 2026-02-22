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
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) {
      navigate("/login");
      return;
    }

    // Load existing entries
    const storedEntries = localStorage.getItem("moodEntries");
    if (storedEntries) {
      setEntries(JSON.parse(storedEntries));
    }
  }, [navigate]);

  const handleSave = () => {
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

    const updatedEntries = [newEntry, ...entries];
    setEntries(updatedEntries);
    localStorage.setItem("moodEntries", JSON.stringify(updatedEntries));

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
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
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
        <Card className="mb-8 shadow-serenity animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-2xl">
              <Heart className="w-6 h-6 text-primary" />
              <span>How are you feeling right now?</span>
            </CardTitle>
            <CardDescription>
              Take a moment to check in with yourself. Your feelings are valid and tracking them helps you understand your patterns.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mood Selection */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">Select your mood:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {moodOptions.map((mood) => (
                  <Button
                    key={mood.name}
                    variant={selectedMood === mood.name ? "default" : "outline"}
                    className={`h-20 flex-col space-y-1 transition-all duration-300 ${
                      selectedMood === mood.name
                        ? "bg-primary text-primary-foreground shadow-serenity"
                        : mood.color
                    }`}
                    onClick={() => setSelectedMood(mood.name)}
                  >
                    <span className="text-2xl">{mood.emoji}</span>
                    <span className="text-sm font-medium">{mood.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Intensity Scale */}
            {selectedMood && (
              <div className="animate-slide-up">
                <h3 className="text-lg font-semibold mb-4 text-foreground">
                  How intense is this feeling? ({intensity}/10)
                </h3>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-muted-foreground">Low</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={intensity}
                    onChange={(e) => setIntensity(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-serenity-calm rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-sm text-muted-foreground">High</span>
                </div>
                <div className="text-center mt-2">
                  <span className="text-2xl font-bold text-primary">{intensity}</span>
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedMood && (
              <div className="animate-slide-up delay-100">
                <h3 className="text-lg font-semibold mb-4 text-foreground">
                  What's on your mind? (optional)
                </h3>
                <Textarea
                  placeholder="Describe what you're feeling, what triggered this mood, or anything else you'd like to remember..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  className="transition-all duration-300 focus:shadow-serenity"
                />
              </div>
            )}

            {/* Save Button */}
            {selectedMood && (
              <div className="flex justify-center animate-slide-up delay-200">
                <Button 
                  onClick={handleSave}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 flex items-center space-x-2 transition-all duration-300 hover:shadow-serenity"
                >
                  <Save className="w-5 h-5" />
                  <span>Save Mood Entry</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Entries */}
        {entries.length > 0 && (
          <Card className="animate-slide-up delay-300">
            <CardHeader>
              <CardTitle>Your Recent Moods</CardTitle>
              <CardDescription>
                Track your emotional patterns over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {entries.slice(0, 10).map((entry) => {
                  const moodOption = moodOptions.find(m => m.name === entry.mood);
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center space-x-4 p-4 rounded-lg bg-serenity-soft/50 border border-serenity-calm/20"
                    >
                      <span className="text-2xl">{moodOption?.emoji}</span>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-foreground">{entry.mood}</span>
                          <span className="text-sm text-muted-foreground">
                            Intensity: {entry.intensity}/10
                          </span>
                        </div>
                        {entry.note && (
                          <p className="text-sm text-muted-foreground">{entry.note}</p>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(entry.date)}
                      </span>
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