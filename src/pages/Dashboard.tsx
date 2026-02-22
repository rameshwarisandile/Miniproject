import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Heart, MessageCircle, Calendar, TrendingUp, Shield } from "lucide-react";

// ✅ added import
import Chatbot from "@/components/ui/Chatbot";

const Dashboard = () => {
  const [userName, setUserName] = useState("");
  const [showChatbot, setShowChatbot] = useState(false); // ✅ added state
  const navigate = useNavigate();

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    const name = localStorage.getItem("userName");
    
    if (!isAuth) {
      navigate("/login");
      return;
    }
    
    setUserName(name || "Friend");
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    navigate("/");
  };

  const getMoodData = () => {
    const storedMoods = localStorage.getItem("moodEntries");
    if (!storedMoods) return { count: 0, lastMood: null };
    
    const moods = JSON.parse(storedMoods);
    return {
      count: moods.length,
      lastMood: moods[moods.length - 1]?.mood || null
    };
  };

  const { count: moodCount, lastMood } = getMoodData();

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
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="flex items-center space-x-2 hover:shadow-serenity transition-all duration-300"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h2 className="text-4xl font-bold mb-2 text-foreground">
            Welcome back, {userName}! 
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
              <div className="text-3xl font-bold text-primary">3</div>
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
              <div className="text-3xl font-bold text-primary">78%</div>
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
              <div className="text-3xl font-bold text-primary">12</div>
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
