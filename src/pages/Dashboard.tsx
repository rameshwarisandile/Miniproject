import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Heart, MessageCircle, Calendar, TrendingUp, Shield, User, Menu, BellRing, HandHeart, ScanFace, Palette, Salad, Sunrise } from "lucide-react";

// added import
import Chatbot from "@/components/ui/Chatbot";

const Dashboard = () => {
  const [userName, setUserName] = useState("");
  const [userImage, setUserImage] = useState("");
  const [showChatbot, setShowChatbot] = useState(false); // added state
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const getProfileImageUrl = (img) => {
    if (!img) return "";
    if (img.startsWith("http") || img.startsWith("data:")) return img;
    return `http://localhost:8120${img}`;
  };

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
      if (!(e.target.closest && e.target.closest("[data-profile-menu='true']"))) {
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
      <header className="bg-card/80 backdrop-blur-sm border-b border-serenity-calm/20 sticky top-0 z-50 overflow-visible">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center overflow-visible">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold bg-serenity-gradient bg-clip-text text-transparent">
              Serenity
            </h1>
          </div>
          {/* Hamburger Menu Profile */}
          <div className="relative flex items-center">
            <button
              data-profile-menu="true"
              aria-label="Open profile menu"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="p-2.5 rounded-lg hover:bg-serenity-gradient/10 hover:shadow-serenity-md focus:outline-none transition-all duration-300 group"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <Menu className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
            {menuOpen && (
              <div
                data-profile-menu="true"
                role="menu"
                className="absolute right-0 top-[calc(100%+0.7rem)] w-[min(18rem,calc(100vw-2rem))] z-[80] flex flex-col animate-fade-in rounded-2xl overflow-hidden border border-serenity-calm/35 bg-card/95 backdrop-blur-md shadow-serenity-lg"
              >
                {/* Profile Header Background */}
                <div className="bg-serenity-gradient/10 pt-6 pb-4 px-6 flex flex-col items-center border-b border-serenity-calm/20">
                  {/* Profile image rendering */}
                  <div className="w-20 h-20 rounded-full object-cover mb-4 border-4 border-serenity-gradient shadow-serenity-lg overflow-hidden flex-shrink-0">
                    <img
                      src={getProfileImageUrl(userImage) || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'User')}&background=random`}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={e => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'User')}&background=random`;
                      }}
                    />
                  </div>
                  <span className="text-lg font-bold text-foreground text-center">{userName}</span>
                  <span className="text-xs text-muted-foreground mt-1">Account owner</span>
                </div>

                {/* Action Section */}
                <div className="px-4 py-4 flex flex-col space-y-3">
                                    <Button
                                      onClick={() => { setMenuOpen(false); navigate('/profile'); }}
                                      className="w-full py-2.5 rounded-lg text-sm font-semibold"
                                      style={{ background: 'none', color: 'inherit', border: '1px solid #ddd', boxShadow: 'none' }}
                                    >
                                      <User className="w-4 h-4 mr-2" />
                                      <span>Profile & Daily Report</span>
                                    </Button>
                  <Button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/profile?tab=reminders');
                    }}
                    className="w-full py-2.5 rounded-lg text-sm font-semibold"
                    style={{ background: 'none', color: 'inherit', border: '1px solid #ddd', boxShadow: 'none' }}
                  >
                    <BellRing className="w-4 h-4 mr-2" />
                    <span>Smart Wellness Reminders</span>
                  </Button>
                  <Button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/profile?tab=social');
                    }}
                    className="w-full py-2.5 rounded-lg text-sm font-semibold"
                    style={{ background: 'none', color: 'inherit', border: '1px solid #ddd', boxShadow: 'none' }}
                  >
                    <HandHeart className="w-4 h-4 mr-2" />
                    <span>Human-Like Interaction</span>
                  </Button>
                  <Button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/profile?tab=zen');
                    }}
                    className="w-full py-2.5 rounded-lg text-sm font-semibold"
                    style={{ background: 'none', color: 'inherit', border: '1px solid #ddd', boxShadow: 'none' }}
                  >
                    <Sunrise className="w-4 h-4 mr-2" />
                    <span>The Daily Zen</span>
                  </Button>
                  <Button
                    onClick={handleLogout}
                    className="w-full btn-primary-enhanced py-2.5 rounded-lg text-sm font-semibold"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>Sign Out</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 relative">
        {/* Ambient background elements for visual depth */}
        <div className="pointer-events-none absolute -top-8 -left-12 w-44 h-44 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute top-6 right-0 w-36 h-36 rounded-full bg-pink-400/10 blur-3xl" />

        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in dashboard-hero-surface rounded-3xl p-6 md:p-8 relative overflow-hidden">
          <div className="relative z-10 grid lg:grid-cols-[1.5fr_1fr] gap-6 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-3 text-foreground leading-tight">
                Welcome back{userName ? `, ${userName}` : ""}!
              </h2>
              <p className="text-base md:text-xl text-muted-foreground max-w-2xl">
                How are you feeling today? Let's check in with your wellness journey.
              </p>

              <div className="mt-5 flex flex-wrap gap-2.5">
                <span className="px-3 py-1.5 rounded-full bg-card/70 border border-serenity-calm/40 text-sm text-foreground">
                  Mood logs: {moodCount}
                </span>
                <span className="px-3 py-1.5 rounded-full bg-card/70 border border-serenity-calm/40 text-sm text-foreground">
                  Active streak: {streak} days
                </span>
                <span className="px-3 py-1.5 rounded-full bg-card/70 border border-serenity-calm/40 text-sm text-foreground">
                  Weekly progress: {progress}%
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-serenity-calm/30 bg-card/65 backdrop-blur-sm p-5 shadow-serenity-md">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/60 shadow-serenity-md">
                  <img
                    src={getProfileImageUrl(userImage) || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'User')}&background=random`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={e => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'User')}&background=random`;
                    }}
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Signed in as</p>
                  <p className="text-base font-semibold text-foreground">{userName || "User"}</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground mb-2">MOOD PULSE</p>
                <div className="dashboard-pulse-track">
                  <span className="dashboard-pulse-bar" />
                  <span className="dashboard-pulse-bar" />
                  <span className="dashboard-pulse-bar" />
                  <span className="dashboard-pulse-bar" />
                  <span className="dashboard-pulse-bar" />
                  <span className="dashboard-pulse-bar" />
                  <span className="dashboard-pulse-bar" />
                  <span className="dashboard-pulse-bar" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8 animate-slide-up">
          <Card className="card-elevated stat-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold label-enhanced flex items-center space-x-2 text-muted-foreground">
                <Heart className="w-4 h-4 text-primary" />
                <span>MOOD ENTRIES</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-gradient-primary">{moodCount}</div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {lastMood ? `Last: ${lastMood}` : "No entries yet"}
              </p>
            </CardContent>
          </Card>

          <Card className="card-elevated stat-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold label-enhanced flex items-center space-x-2 text-muted-foreground">
                <Calendar className="w-4 h-4 text-primary" />
                <span>STREAK</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-gradient-primary">{streak}</div>
              <p className="text-xs text-muted-foreground mt-1">Days active</p>
            </CardContent>
          </Card>

          <Card className="card-elevated stat-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold label-enhanced flex items-center space-x-2 text-muted-foreground">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span>PROGRESS</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-gradient-primary">{progress}%</div>
              <p className="text-xs text-muted-foreground mt-1">Weekly goal</p>
            </CardContent>
          </Card>

          <Card className="card-elevated stat-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold label-enhanced flex items-center space-x-2 text-muted-foreground">
                <MessageCircle className="w-4 h-4 text-primary" />
                <span>CHAT SESSIONS</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-gradient-primary">{chatCount}</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up delay-100">
          <Card className="card-elevated p-6 hover:shadow-serenity-lg transition-all duration-300 hover:-translate-y-2">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-serenity-gradient rounded-xl flex items-center justify-center mx-auto mb-4 shadow-serenity-lg transform transition-transform hover:scale-105">
                <Heart className="text-white w-8 h-8" />
              </div>
              <CardTitle className="text-xl font-bold text-foreground">Track Your Mood</CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-2">
                Log how you're feeling today and discover patterns in your emotions
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link to="/mood-tracker">
                <Button
                  size="sm"
                  className="btn-primary-enhanced px-6 py-2.5 rounded-lg"
                >
                  Check In Now
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="card-elevated p-6 hover:shadow-serenity-lg transition-all duration-300 hover:-translate-y-2">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-serenity-gradient rounded-xl flex items-center justify-center mx-auto mb-4 shadow-serenity-lg transform transition-transform hover:scale-105">
                <MessageCircle className="text-white w-8 h-8" />
              </div>
              <CardTitle className="text-xl font-bold text-foreground">AI Companion</CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-2">
                Get personalized support and coping strategies from our AI
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                size="sm" 
                className="btn-primary-enhanced px-6 py-2.5 rounded-lg"
                onClick={() => setShowChatbot(!showChatbot)}
              >
                {showChatbot ? "Close Chat" : "Open Chat"}
              </Button>
            </CardContent>
          </Card>

          <Card className="card-elevated p-6 hover:shadow-serenity-lg transition-all duration-300 hover:-translate-y-2">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-serenity-gradient rounded-xl flex items-center justify-center mx-auto mb-4 shadow-serenity-lg transform transition-transform hover:scale-105">
                <Heart className="text-white w-8 h-8" />
              </div>
              <CardTitle className="text-xl font-bold text-foreground">Meditation</CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-2">
                Guided sessions and breathing exercises for inner peace
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link to="/meditation">
                <Button size="sm" className="btn-primary-enhanced px-6 py-2.5 rounded-lg">
                  Start Session
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="card-elevated p-6 hover:shadow-serenity-lg transition-all duration-300 hover:-translate-y-2">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-serenity-gradient rounded-xl flex items-center justify-center mx-auto mb-4 shadow-serenity-lg transform transition-transform hover:scale-105">
                <Palette className="text-white w-8 h-8" />
              </div>
              <CardTitle className="text-xl font-bold text-foreground">Mood-to-Art</CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-2">
                Convert your feelings into a downloadable AI-inspired digital painting
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link to="/mood-to-art">
                <Button size="sm" className="btn-primary-enhanced px-6 py-2.5 rounded-lg">
                  Create Art
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="card-elevated p-6 hover:shadow-serenity-lg transition-all duration-300 hover:-translate-y-2">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-serenity-gradient rounded-xl flex items-center justify-center mx-auto mb-4 shadow-serenity-lg transform transition-transform hover:scale-105">
                <Salad className="text-white w-8 h-8" />
              </div>
              <CardTitle className="text-xl font-bold text-foreground">Mind-Gut Connection</CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-2">
                AI food suggestions based on your current mood to support gut-brain wellness
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link to="/mind-gut">
                <Button size="sm" className="btn-primary-enhanced px-6 py-2.5 rounded-lg">
                  Get Food Plan
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="card-elevated p-6 hover:shadow-serenity-lg transition-all duration-300 hover:-translate-y-2">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-serenity-gradient rounded-xl flex items-center justify-center mx-auto mb-4 shadow-serenity-lg transform transition-transform hover:scale-105">
                <Heart className="text-white w-8 h-8" />
              </div>
              <CardTitle className="text-xl font-bold text-foreground">Journal</CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-2">
                Daily gratitude and reflection practice for wellness
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link to="/journal">
                <Button size="sm" className="btn-primary-enhanced px-6 py-2.5 rounded-lg">
                  Write Today
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="card-elevated p-6 hover:shadow-serenity-lg transition-all duration-300 hover:-translate-y-2">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-serenity-gradient rounded-xl flex items-center justify-center mx-auto mb-4 shadow-serenity-lg transform transition-transform hover:scale-105">
                <TrendingUp className="text-white w-8 h-8" />
              </div>
              <CardTitle className="text-xl font-bold text-foreground">Analytics</CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-2">
                Track progress and discover insights about your wellness
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link to="/analytics">
                <Button size="sm" className="btn-primary-enhanced px-6 py-2.5 rounded-lg">
                  View Insights
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="card-elevated p-6 hover:shadow-serenity-lg transition-all duration-300 hover:-translate-y-2">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-serenity-gradient rounded-xl flex items-center justify-center mx-auto mb-4 shadow-serenity-lg transform transition-transform hover:scale-105">
                <Shield className="text-white w-8 h-8" />
              </div>
              <CardTitle className="text-xl font-bold text-foreground">Crisis Support</CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-2">
                Emergency resources and safety planning when you need it most
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link to="/crisis-support">
                <Button size="sm" className="btn-primary-enhanced px-6 py-2.5 rounded-lg">
                  Get Help
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="card-elevated p-6 hover:shadow-serenity-lg transition-all duration-300 hover:-translate-y-2">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-serenity-gradient rounded-xl flex items-center justify-center mx-auto mb-4 shadow-serenity-lg transform transition-transform hover:scale-105">
                <ScanFace className="text-white w-8 h-8" />
              </div>
              <CardTitle className="text-xl font-bold text-foreground">Mood Scanner</CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-2">
                Camera + voice based emotion check-in with AI wellness guidance
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link to="/mood-scanner">
                <Button size="sm" className="btn-primary-enhanced px-6 py-2.5 rounded-lg">
                  Start Scan
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* render chatbot if active */}
      {showChatbot && <Chatbot />} 
    </div>
  );
};

export default Dashboard;
