  // Helper to get full image URL
  const getProfileImageUrl = (img) => {
    if (!img) return "";
    if (img.startsWith("http") || img.startsWith("data:")) return img;
    // Change this to your backend base URL if different
    return `http://localhost:8120${img}`;
  };
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Heart, MessageCircle, Calendar, TrendingUp, Shield, User, Menu } from "lucide-react";

// ✅ added import
import Chatbot from "@/components/ui/Chatbot";

const Dashboard = () => {
  const [userName, setUserName] = useState("");
  const [userImage, setUserImage] = useState("");
  const [showChatbot, setShowChatbot] = useState(false); // ✅ added state
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Define userId at the top so all functions can use it
  const backendUser = JSON.parse(localStorage.getItem("backendUser") || '{}');
  const userId = backendUser?.id || backendUser?._id || null;

  useEffect(() => {
    // Debug: log backendUser and localStorage image
    console.log('backendUser:', backendUser);
    console.log('loggedInUserImage:', localStorage.getItem('loggedInUserImage'));
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    if (backendUser) {
      setUserName(backendUser.name || "");
      setUserImage(backendUser.profileImage || "");
    } else {
      // Fallback to localStorage
      const storedName = localStorage.getItem("loggedInUserName");
      const storedImage = localStorage.getItem("loggedInUserImage");
      setUserName(storedName || "");
      setUserImage(storedImage || "");
    }
  }, [navigate]);

  // Optional: close dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e) => {
      if (!(e.target.closest && e.target.closest("#profile-menu"))) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const handleLogout = () => {
    // Remove all per-user data from state (not from localStorage, so other users' data is safe)
    setUserName("");
    setUserImage("");
    // Optionally, clear in-memory state for moods, chats, analytics, journal
    // (localStorage will be reloaded on next login)
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("backendUser");
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("loggedInUserName");
    localStorage.removeItem("loggedInUserImage");
    // Clear chatbot messages for this user
    try {
      const allChats = JSON.parse(localStorage.getItem("allChatMessages") || '{}');
      if (userId && allChats[userId]) {
        delete allChats[userId];
        localStorage.setItem("allChatMessages", JSON.stringify(allChats));
      }
    } catch (e) {}
    setMenuOpen(false);
    navigate("/login");
  };

  // Mood Entries (per user)
  const getMoodData = () => {
    let allMoods = JSON.parse(localStorage.getItem("allMoodEntries") || '{}');
    const moods = userId && allMoods[userId] ? allMoods[userId] : [];
    return {
      count: moods.length,
      lastMood: moods.length > 0 ? moods[moods.length - 1]?.mood : null
    };
  };

  // Chat Sessions (per user)
  const getChatData = () => {
    let allChats = JSON.parse(localStorage.getItem("allChatMessages") || '{}');
    const chats = userId && allChats[userId] ? allChats[userId] : [];
    return {
      count: chats.length
    };
  };

  // Analytics/Progress (per user, example: mood goal 12/week)
  const getProgress = () => {
    let allMoods = JSON.parse(localStorage.getItem("allMoodEntries") || '{}');
    const moods = userId && allMoods[userId] ? allMoods[userId] : [];
    // Example: 12 moods/week goal
    const weekMoods = moods.filter(entry => {
      const entryDate = new Date(entry.date);
      const now = new Date();
      const diff = (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    });
    return weekMoods.length > 0 ? Math.round((weekMoods.length / 12) * 100) : 0;
  };

  // Streak (per user, example: days with at least 1 mood)
  const getStreak = () => {
    let allMoods = JSON.parse(localStorage.getItem("allMoodEntries") || '{}');
    const moods = userId && allMoods[userId] ? allMoods[userId] : [];
    let streak = 0;
    let lastDate = null;
    moods.forEach(entry => {
      const entryDate = new Date(entry.date).toDateString();
      if (entryDate !== lastDate) {
        streak++;
        lastDate = entryDate;
      }
    });
    return streak;
  };

  const { count: moodCount, lastMood } = getMoodData();
  const { count: chatCount } = getChatData();
  const progress = getProgress();
  const streak = getStreak();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-serenity-soft">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-serenity-calm/20 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold bg-serenity-gradient bg-clip-text text-transparent">
              Serenity
            </h1>
          </div>
          {/* Hamburger Menu Profile */}
          <div className="relative flex items-center">
            <button
              id="profile-menu"
              aria-label="Open profile menu"
              className="p-2 rounded hover:bg-muted/40 focus:outline-none"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <Menu className="w-7 h-7 text-muted-foreground" />
            </button>
            {menuOpen && (
              <div
                id="profile-menu"
                className="absolute right-0 mt-2 w-44 bg-card border border-border rounded-lg shadow-lg z-50 flex flex-col items-center py-4 animate-fade-in"
              >
                {/* Profile image rendering below */}
                <img
                  src={getProfileImageUrl(userImage) || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'User')}&background=random`}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover mb-2 border"
                  onError={e => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'User')}&background=random`;
                  }}
                />
                <span className="text-sm font-semibold text-foreground mb-2">{userName}</span>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-1 text-xs h-auto"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h2 className="text-4xl font-bold mb-2 text-foreground">
            Welcome back{userName ? `, ${userName}` : ""}!
          </h2>
          <p className="text-xl text-muted-foreground">
            How are you feeling today? Let's check in with your wellness journey.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8 animate-slide-up">
          <Card className="hover:shadow-serenity transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
                <Heart className="w-4 h-4" />
                <span>Mood Entries</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{moodCount}</div>
              <p className="text-xs text-muted-foreground">
                {lastMood ? `Last: ${lastMood}` : "No entries yet"}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-serenity transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Streak</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{streak}</div>
              <p className="text-xs text-muted-foreground">Days active</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-serenity transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{progress}%</div>
              <p className="text-xs text-muted-foreground">Weekly goal</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-serenity transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
                <MessageCircle className="w-4 h-4" />
                <span>Chat Sessions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{chatCount}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up delay-100">
          <Card className="p-6 hover:shadow-serenity transition-all duration-300 hover:-translate-y-2">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-serenity-gradient rounded-full flex items-center justify-center mx-auto mb-3">
                <Heart className="text-white w-8 h-8" />
              </div>
              <CardTitle className="text-xl">Track Your Mood</CardTitle>
              <CardDescription className="text-sm">
                Log how you're feeling today and discover patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link to="/mood-tracker">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 transition-all duration-300 hover:shadow-serenity">
                  Check In Now
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="p-6 hover:shadow-serenity transition-all duration-300 hover:-translate-y-2">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-serenity-gradient rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="text-white w-8 h-8" />
              </div>
              <CardTitle className="text-xl">AI Companion</CardTitle>
              <CardDescription className="text-sm">
                Get personalized support and coping strategies
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                size="sm" 
                variant="outline"
                className="px-6 py-2 transition-all duration-300 hover:shadow-serenity"
                onClick={() => setShowChatbot(!showChatbot)}
              >
                {showChatbot ? "Close Chat" : "Open Chat"}
              </Button>
            </CardContent>
          </Card>

          <Card className="p-6 hover:shadow-serenity transition-all duration-300 hover:-translate-y-2">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-serenity-gradient rounded-full flex items-center justify-center mx-auto mb-3">
                <Heart className="text-white w-8 h-8" />
              </div>
              <CardTitle className="text-xl">Meditation</CardTitle>
              <CardDescription className="text-sm">
                Guided sessions and breathing exercises
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link to="/meditation">
                <Button size="sm" variant="outline" className="px-6 py-2 transition-all duration-300 hover:shadow-serenity">
                  Start Session
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="p-6 hover:shadow-serenity transition-all duration-300 hover:-translate-y-2">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-serenity-gradient rounded-full flex items-center justify-center mx-auto mb-3">
                <Heart className="text-white w-8 h-8" />
              </div>
              <CardTitle className="text-xl">Journal</CardTitle>
              <CardDescription className="text-sm">
                Daily gratitude and reflection practice
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link to="/journal">
                <Button size="sm" variant="outline" className="px-6 py-2 transition-all duration-300 hover:shadow-serenity">
                  Write Today
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="p-6 hover:shadow-serenity transition-all duration-300 hover:-translate-y-2">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-serenity-gradient rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="text-white w-8 h-8" />
              </div>
              <CardTitle className="text-xl">Analytics</CardTitle>
              <CardDescription className="text-sm">
                Track progress and discover insights
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link to="/analytics">
                <Button size="sm" variant="outline" className="px-6 py-2 transition-all duration-300 hover:shadow-serenity">
                  View Insights
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="p-6 hover:shadow-serenity transition-all duration-300 hover:-translate-y-2">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-serenity-gradient rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="text-white w-8 h-8" />
              </div>
              <CardTitle className="text-xl">Crisis Support</CardTitle>
              <CardDescription className="text-sm">
                Emergency resources and safety planning
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link to="/crisis-support">
                <Button size="sm" variant="outline" className="px-6 py-2 transition-all duration-300 hover:shadow-serenity">
                  Get Help
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ✅ render chatbot if active */}
      {showChatbot && <Chatbot />} 
    </div>
  );
};

export default Dashboard;
