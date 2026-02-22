import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Plus, Target, Trophy, Heart, Star, BookOpen, CheckCircle } from "lucide-react";

interface JournalEntry {
  id: string;
  date: string;
  gratitude: string[];
  reflection: string;
  mood: string;
  goals: Goal[];
}

interface Goal {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
  category: "journaling" | "goals" | "streaks" | "wellness";
}

const WellnessJournal = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry>({
    id: "",
    date: new Date().toISOString().split('T')[0],
    gratitude: [],
    reflection: "",
    mood: "",
    goals: []
  });
  const [newGratitude, setNewGratitude] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    loadJournalData();
    checkAchievements();
  }, []);

  const loadJournalData = () => {
    const savedEntries = localStorage.getItem("wellnessJournal");
    const savedAchievements = localStorage.getItem("wellnessAchievements");
    
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }
    
    if (savedAchievements) {
      setAchievements(JSON.parse(savedAchievements));
    }
    
    calculateStreak();
  };

  const calculateStreak = () => {
    if (entries.length === 0) return;
    
    let streak = 0;
    const today = new Date();
    const sortedEntries = entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    for (let i = 0; i < sortedEntries.length; i++) {
      const entryDate = new Date(sortedEntries[i].date);
      const diffTime = Math.abs(today.getTime() - entryDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === streak) {
        streak++;
      } else {
        break;
      }
    }
    
    setCurrentStreak(streak);
  };

  const addGratitude = () => {
    if (newGratitude.trim() && currentEntry.gratitude.length < 3) {
      setCurrentEntry(prev => ({
        ...prev,
        gratitude: [...prev.gratitude, newGratitude.trim()]
      }));
      setNewGratitude("");
    }
  };

  const removeGratitude = (index: number) => {
    setCurrentEntry(prev => ({
      ...prev,
      gratitude: prev.gratitude.filter((_, i) => i !== index)
    }));
  };

  const addGoal = () => {
    if (newGoal.trim()) {
      const goal: Goal = {
        id: Date.now().toString(),
        text: newGoal.trim(),
        completed: false,
        createdAt: new Date().toISOString()
      };
      
      setCurrentEntry(prev => ({
        ...prev,
        goals: [...prev.goals, goal]
      }));
      setNewGoal("");
    }
  };

  const toggleGoal = (goalId: string) => {
    setCurrentEntry(prev => ({
      ...prev,
      goals: prev.goals.map(goal => 
        goal.id === goalId 
          ? { ...goal, completed: !goal.completed, completedAt: !goal.completed ? new Date().toISOString() : undefined }
          : goal
      )
    }));
  };

  const saveEntry = () => {
    if (!currentEntry.mood || currentEntry.gratitude.length === 0) {
      alert("Please select a mood and add at least one gratitude item.");
      return;
    }

    const entry: JournalEntry = {
      ...currentEntry,
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0]
    };

    const updatedEntries = [entry, ...entries];
    setEntries(updatedEntries);
    localStorage.setItem("wellnessJournal", JSON.stringify(updatedEntries));

    // Reset form
    setCurrentEntry({
      id: "",
      date: new Date().toISOString().split('T')[0],
      gratitude: [],
      reflection: "",
      mood: "",
      goals: []
    });

    calculateStreak();
    checkAchievements();
    
    alert("Journal entry saved successfully! 🌟");
  };

  const checkAchievements = () => {
    const newAchievements: Achievement[] = [];
    
    // First entry achievement
    if (entries.length === 1 && !achievements.find(a => a.id === "first_entry")) {
      newAchievements.push({
        id: "first_entry",
        title: "First Steps",
        description: "Completed your first journal entry",
        icon: "📝",
        unlockedAt: new Date().toISOString(),
        category: "journaling"
      });
    }
    
    // 7-day streak achievement
    if (currentStreak >= 7 && !achievements.find(a => a.id === "week_streak")) {
      newAchievements.push({
        id: "week_streak",
        title: "Week Warrior",
        description: "Maintained a 7-day journaling streak",
        icon: "🔥",
        unlockedAt: new Date().toISOString(),
        category: "streaks"
      });
    }
    
    // Goal completion achievement
    const completedGoals = entries.flatMap(entry => entry.goals.filter(goal => goal.completed));
    if (completedGoals.length >= 5 && !achievements.find(a => a.id === "goal_setter")) {
      newAchievements.push({
        id: "goal_setter",
        title: "Goal Getter",
        description: "Completed 5 wellness goals",
        icon: "🎯",
        unlockedAt: new Date().toISOString(),
        category: "goals"
      });
    }
    
    if (newAchievements.length > 0) {
      const updatedAchievements = [...achievements, ...newAchievements];
      setAchievements(updatedAchievements);
      localStorage.setItem("wellnessAchievements", JSON.stringify(updatedAchievements));
    }
  };

  const getMoodEmoji = (mood: string) => {
    const moodEmojis: { [key: string]: string } = {
      "happy": "😊",
      "calm": "😌",
      "excited": "🤩",
      "anxious": "😰",
      "sad": "😢",
      "angry": "😠",
      "tired": "😴",
      "grateful": "🙏"
    };
    return moodEmojis[mood] || "😐";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Wellness Journal
        </h1>
        <p className="text-xl text-muted-foreground">
          Reflect, grow, and celebrate your wellness journey
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Current Entry Form */}
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5" />
                <span>Today's Entry</span>
                <Badge variant="secondary">{currentEntry.date}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mood Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">How are you feeling today?</label>
                <div className="grid grid-cols-4 gap-2">
                  {["happy", "calm", "excited", "anxious", "sad", "angry", "tired", "grateful"].map((mood) => (
                    <Button
                      key={mood}
                      variant={currentEntry.mood === mood ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentEntry(prev => ({ ...prev, mood }))}
                      className="flex flex-col items-center space-y-1 h-20"
                    >
                      <span className="text-2xl">{getMoodEmoji(mood)}</span>
                      <span className="text-xs capitalize">{mood}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Gratitude Section */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  What are you grateful for today? ({currentEntry.gratitude.length}/3)
                </label>
                <div className="space-y-2">
                  {currentEntry.gratitude.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="flex-1">{item}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeGratitude(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  {currentEntry.gratitude.length < 3 && (
                    <div className="flex space-x-2">
                      <Input
                        value={newGratitude}
                        onChange={(e) => setNewGratitude(e.target.value)}
                        placeholder="Add something you're grateful for..."
                        onKeyPress={(e) => e.key === 'Enter' && addGratitude()}
                      />
                      <Button onClick={addGratitude} size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Reflection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Reflection (optional)</label>
                <Textarea
                  value={currentEntry.reflection}
                  onChange={(e) => setCurrentEntry(prev => ({ ...prev, reflection: e.target.value }))}
                  placeholder="How was your day? What did you learn? What would you like to improve?"
                  rows={3}
                />
              </div>

              {/* Goals */}
              <div>
                <label className="text-sm font-medium mb-2 block">Wellness Goals</label>
                <div className="space-y-2">
                  {currentEntry.goals.map((goal) => (
                    <div key={goal.id} className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleGoal(goal.id)}
                        className={goal.completed ? "text-green-600" : "text-gray-400"}
                      >
                        {goal.completed ? <CheckCircle className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                      </Button>
                      <span className={`flex-1 ${goal.completed ? 'line-through text-gray-500' : ''}`}>
                        {goal.text}
                      </span>
                    </div>
                  ))}
                  <div className="flex space-x-2">
                    <Input
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      placeholder="Add a wellness goal..."
                      onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                    />
                    <Button onClick={addGoal} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Button onClick={saveEntry} className="w-full" size="lg">
                Save Entry
              </Button>
            </CardContent>
          </Card>

          {/* Previous Entries */}
          <Card>
            <CardHeader>
              <CardTitle>Previous Entries</CardTitle>
            </CardHeader>
            <CardContent>
              {entries.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No entries yet. Start your wellness journey today!
                </p>
              ) : (
                <div className="space-y-4">
                  {entries.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{getMoodEmoji(entry.mood)}</span>
                          <span className="font-medium capitalize">{entry.mood}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{formatDate(entry.date)}</span>
                      </div>
                      {entry.gratitude.length > 0 && (
                        <div className="mb-2">
                          <p className="text-sm text-muted-foreground">Grateful for:</p>
                          <div className="flex flex-wrap gap-1">
                            {entry.gratitude.map((item, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {entry.reflection && (
                        <p className="text-sm mb-2">{entry.reflection}</p>
                      )}
                      {entry.goals.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground">Goals:</p>
                          <div className="flex flex-wrap gap-1">
                            {entry.goals.map((goal) => (
                              <Badge 
                                key={goal.id} 
                                variant={goal.completed ? "default" : "outline"}
                                className="text-xs"
                              >
                                {goal.text}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Stats & Achievements */}
        <div className="space-y-6">
          {/* Streak Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-red-500" />
                <span>Current Streak</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-bold text-red-500 mb-2">{currentStreak}</div>
              <p className="text-sm text-muted-foreground">days of journaling</p>
              <Progress value={Math.min((currentStreak / 30) * 100, 100)} className="mt-4" />
              <p className="text-xs text-muted-foreground mt-2">Goal: 30 days</p>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Your Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Entries</span>
                <span className="font-semibold">{entries.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Goals Completed</span>
                <span className="font-semibold">
                  {entries.flatMap(entry => entry.goals.filter(goal => goal.completed)).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Gratitude Items</span>
                <span className="font-semibold">
                  {entries.reduce((sum, entry) => sum + entry.gratitude.length, 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Achievements Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span>Achievements</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {achievements.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-4">
                  Complete journal entries to unlock achievements!
                </p>
              ) : (
                <div className="space-y-3">
                  {achievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-center space-x-3 p-2 bg-yellow-50 rounded-lg">
                      <span className="text-2xl">{achievement.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{achievement.title}</p>
                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WellnessJournal;
