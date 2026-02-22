import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Activity, Calendar, Target, BarChart3, PieChart, LineChart, Moon, Sun, Zap } from "lucide-react";

// Chart components (we'll create simple SVG-based charts)
const PieChartComponent = ({ data }: { data: { mood: string; percentage: number }[] }) => {
  if (data.length === 0) return <div className="text-center text-muted-foreground py-8">No data available</div>;
  
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];
  const radius = 80;
  const centerX = 100;
  const centerY = 100;
  
  let currentAngle = 0;
  const paths = data.map((item, index) => {
    const angle = (item.percentage / 100) * 2 * Math.PI;
    const x1 = centerX + radius * Math.cos(currentAngle);
    const y1 = centerY + radius * Math.sin(currentAngle);
    const x2 = centerX + radius * Math.cos(currentAngle + angle);
    const y2 = centerY + radius * Math.sin(currentAngle + angle);
    
    const largeArcFlag = angle > Math.PI ? 1 : 0;
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    currentAngle += angle;
    
    return (
      <path
        key={item.mood}
        d={pathData}
        fill={colors[index % colors.length]}
        stroke="white"
        strokeWidth="2"
      />
    );
  });
  
  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="200" className="mb-4">
        {paths}
        <circle cx={centerX} cy={centerY} r="3" fill="white" />
      </svg>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {data.map((item, index) => (
          <div key={item.mood} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className="capitalize">{item.mood}</span>
            <span className="font-medium">{Math.round(item.percentage)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const LineChartComponent = ({ data }: { data: { date: string; score: number }[] }) => {
  if (data.length < 2) return <div className="text-center text-muted-foreground py-8">Need at least 2 data points</div>;
  
  const width = 400;
  const height = 200;
  const padding = 40;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;
  
  const maxScore = Math.max(...data.map(d => d.score));
  const minScore = Math.min(...data.map(d => d.score));
  const scoreRange = maxScore - minScore;
  
  const points = data.map((item, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((item.score - minScore) / scoreRange) * chartHeight;
    return { x, y, score: item.score };
  });
  
  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');
  
  return (
    <div className="flex flex-col items-center">
      <svg width={width} height={height} className="mb-4">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(score => {
          const y = padding + chartHeight - ((score - minScore) / scoreRange) * chartHeight;
          return (
            <g key={score}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#E5E7EB"
                strokeWidth="1"
                strokeDasharray="5,5"
              />
              <text x={padding - 25} y={y + 4} className="text-xs text-muted-foreground">
                {score}
              </text>
            </g>
          );
        })}
        
        {/* Line chart */}
        <path
          d={pathData}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#3B82F6"
            stroke="white"
            strokeWidth="2"
          />
        ))}
      </svg>
    </div>
  );
};

const BarChartComponent = ({ data }: { data: { date: string; hours: number; quality: string }[] }) => {
  if (data.length === 0) return <div className="text-center text-muted-foreground py-8">No data available</div>;
  
  const maxHours = Math.max(...data.map(d => d.hours));
  const barWidth = 30;
  const barSpacing = 10;
  const chartHeight = 150;
  const padding = 40;
  
  return (
    <div className="flex flex-col items-center">
      <svg width={data.length * (barWidth + barSpacing) + 2 * padding} height={chartHeight + 2 * padding}>
        {/* Bars */}
        {data.map((item, index) => {
          const barHeight = (item.hours / maxHours) * chartHeight;
          const x = padding + index * (barWidth + barSpacing);
          const y = padding + chartHeight - barHeight;
          
          const qualityColors = {
            excellent: '#10B981',
            good: '#3B82F6',
            fair: '#F59E0B',
            poor: '#EF4444'
          };
          
          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={qualityColors[item.quality as keyof typeof qualityColors] || '#6B7280'}
                rx="3"
              />
              <text
                x={x + barWidth / 2}
                y={padding + chartHeight + 15}
                textAnchor="middle"
                className="text-xs text-muted-foreground"
              >
                {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </text>
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                className="text-xs font-medium"
              >
                {item.hours.toFixed(1)}h
              </text>
            </g>
          );
        })}
      </svg>
      
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs">
        {Object.entries({ excellent: '#10B981', good: '#3B82F6', fair: '#F59E0B', poor: '#EF4444' }).map(([quality, color]) => (
          <div key={quality} className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
            <span className="capitalize">{quality}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface MoodData {
  date: string;
  mood: string;
  intensity: number;
  note?: string;
}

interface SleepData {
  date: string;
  hours: number;
  quality: "excellent" | "good" | "fair" | "poor";
  mood: string;
}

interface WellnessScore {
  date: string;
  score: number;
  factors: {
    mood: number;
    sleep: number;
    activity: number;
    social: number;
  };
}

const WellnessAnalytics = () => {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const [moodData, setMoodData] = useState<MoodData[]>([]);
  const [sleepData, setSleepData] = useState<SleepData[]>([]);
  const [wellnessScores, setWellnessScores] = useState<WellnessScore[]>([]);
  const [currentScore, setCurrentScore] = useState<number>(0);

  useEffect(() => {
    loadData();
    calculateCurrentScore();
  }, [timeRange]);

  const loadData = () => {
    // Load mood data from localStorage
    const storedMoods = localStorage.getItem("moodEntries");
    if (storedMoods) {
      const moods = JSON.parse(storedMoods);
      const filteredMoods = filterDataByTimeRange(moods, timeRange);
      setMoodData(filteredMoods);
    } else {
      // Generate sample mood data if none exists (for demo purposes)
      const sampleMoodData = generateSampleMoodData(timeRange);
      setMoodData(sampleMoodData);
    }

    // Load sleep data (simulated for demo)
    const simulatedSleepData = generateSleepData(timeRange);
    setSleepData(simulatedSleepData);

    // Generate wellness scores
    const scores = generateWellnessScores(timeRange);
    setWellnessScores(scores);
  };

  const filterDataByTimeRange = (data: any[], range: string) => {
    const now = new Date();
    const daysAgo = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    
    return data.filter(item => new Date(item.date) >= cutoffDate);
  };

  const generateSampleMoodData = (range: string): MoodData[] => {
    const data: MoodData[] = [];
    const now = new Date();
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    
    const moods = ["happy", "calm", "excited", "anxious", "sad", "angry", "tired", "grateful"];
    const moodWeights = [0.25, 0.20, 0.15, 0.10, 0.08, 0.05, 0.12, 0.05]; // Probability distribution
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const dayOfWeek = date.getDay();
      
      // Weekend vs weekday mood patterns
      let moodIndex;
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
        moodIndex = Math.random() < 0.6 ? 0 : Math.random() < 0.8 ? 1 : 2; // More positive on weekends
      } else { // Weekday
        moodIndex = Math.random() < 0.4 ? 0 : Math.random() < 0.7 ? 1 : Math.random() < 0.85 ? 2 : 3;
      }
      
      const mood = moods[moodIndex];
      const intensity = moodIndex <= 2 ? Math.random() * 0.3 + 0.7 : Math.random() * 0.4 + 0.4; // Positive moods have higher intensity
      
      data.push({
        date: date.toISOString().split('T')[0],
        mood: mood,
        intensity: Math.round(intensity * 100) / 100,
        note: `Sample mood data for ${date.toLocaleDateString()}`
      });
    }
    
    return data;
  };

  const generateSleepData = (range: string): SleepData[] => {
    const data: SleepData[] = [];
    const now = new Date();
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    
    // Generate more realistic and varied sleep data
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const dayOfWeek = date.getDay();
      
      // Weekend vs weekday sleep patterns
      let hours, quality;
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
        hours = Math.random() * 2 + 7.5; // 7.5-9.5 hours
        quality = ["excellent", "good"][Math.floor(Math.random() * 2)] as any;
      } else { // Weekday
        hours = Math.random() * 2 + 6.5; // 6.5-8.5 hours
        quality = ["good", "fair", "excellent"][Math.floor(Math.random() * 3)] as any;
      }
      
      data.push({
        date: date.toISOString().split('T')[0],
        hours: Math.round(hours * 10) / 10, // Round to 1 decimal
        quality: quality,
        mood: ["happy", "calm", "excited", "anxious", "sad", "angry", "tired", "grateful"][Math.floor(Math.random() * 8)]
      });
    }
    
    return data;
  };

  const generateWellnessScores = (range: string): WellnessScore[] => {
    const data: WellnessScore[] = [];
    const now = new Date();
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    
    // Generate more realistic wellness scores with trends
    let baseMood = 75;
    let baseSleep = 80;
    let baseActivity = 70;
    let baseSocial = 75;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const dayOfWeek = date.getDay();
      
      // Add some weekly patterns
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend boost
        baseMood += Math.random() * 10 - 5; // ±5 variation
        baseActivity += Math.random() * 15 - 5; // +10 to activity
        baseSocial += Math.random() * 10 - 2; // +8 to social
      } else { // Weekday patterns
        baseMood += Math.random() * 8 - 4; // ±4 variation
        baseActivity += Math.random() * 10 - 8; // +2 to activity
        baseSocial += Math.random() * 8 - 6; // +2 to social
      }
      
      // Ensure scores stay within bounds
      const moodScore = Math.max(60, Math.min(100, baseMood));
      const sleepScore = Math.max(70, Math.min(100, baseSleep + Math.random() * 10 - 5));
      const activityScore = Math.max(50, Math.min(100, baseActivity));
      const socialScore = Math.max(60, Math.min(100, baseSocial));
      
      data.push({
        date: date.toISOString().split('T')[0],
        score: Math.round((moodScore + sleepScore + activityScore + socialScore) / 4),
        factors: {
          mood: Math.round(moodScore),
          sleep: Math.round(sleepScore),
          activity: Math.round(activityScore),
          social: Math.round(socialScore)
        }
      });
      
      // Slight decay for next day
      baseMood = Math.max(70, baseMood - 1);
      baseSleep = Math.max(75, baseSleep - 0.5);
      baseActivity = Math.max(60, baseActivity - 1);
      baseSocial = Math.max(70, baseSocial - 0.5);
    }
    
    return data;
  };

  const calculateCurrentScore = () => {
    if (wellnessScores.length > 0) {
      const latestScore = wellnessScores[wellnessScores.length - 1];
      setCurrentScore(latestScore.score);
    }
  };

  const getMoodTrend = () => {
    if (moodData.length < 2) return "stable";
    
    const recentMoods = moodData.slice(-7);
    const firstHalf = recentMoods.slice(0, Math.floor(recentMoods.length / 2));
    const secondHalf = recentMoods.slice(Math.floor(recentMoods.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, item) => sum + item.intensity, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, item) => sum + item.intensity, 0) / secondHalf.length;
    
    if (secondAvg > firstAvg + 0.5) return "improving";
    if (secondAvg < firstAvg - 0.5) return "declining";
    return "stable";
  };

  const getSleepQuality = () => {
    if (sleepData.length === 0) return "unknown";
    
    const recentSleep = sleepData.slice(-7);
    const excellentCount = recentSleep.filter(sleep => sleep.quality === "excellent").length;
    const goodCount = recentSleep.filter(sleep => sleep.quality === "good").length;
    
    if (excellentCount >= 3) return "excellent";
    if (excellentCount + goodCount >= 5) return "good";
    if (excellentCount + goodCount >= 3) return "fair";
    return "poor";
  };

  const getMoodDistribution = () => {
    const moodCounts: { [key: string]: number } = {};
    moodData.forEach(item => {
      moodCounts[item.mood] = (moodCounts[item.mood] || 0) + 1;
    });
    
    return Object.entries(moodCounts)
      .map(([mood, count]) => ({ mood, count, percentage: (count / moodData.length) * 100 }))
      .sort((a, b) => b.count - a.count);
  };

  const getWellnessInsights = () => {
    const insights = [];
    
    // Mood insights
    const moodTrend = getMoodTrend();
    if (moodTrend === "improving") {
      insights.push("Your mood has been improving over the past week! Keep up the positive momentum.");
    } else if (moodTrend === "declining") {
      insights.push("Your mood has been declining. Consider reaching out to friends or trying some self-care activities.");
    }
    
    // Sleep insights
    const sleepQuality = getSleepQuality();
    if (sleepQuality === "poor") {
      insights.push("Your sleep quality could improve. Try establishing a consistent bedtime routine.");
    } else if (sleepQuality === "excellent") {
      insights.push("Great sleep quality! This is likely contributing to your overall wellness.");
    }
    
    // Score insights
    if (currentScore >= 80) {
      insights.push("Excellent wellness score! You're doing great at maintaining balance in your life.");
    } else if (currentScore >= 60) {
      insights.push("Good wellness score. Small improvements in any area could boost your overall score.");
    } else {
      insights.push("Your wellness score suggests some areas for improvement. Focus on one area at a time.");
    }
    
    return insights;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Wellness Analytics
        </h1>
        <p className="text-xl text-muted-foreground">
          Track your progress and discover patterns in your wellness journey
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="flex justify-center mb-8">
        <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Current Score</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(currentScore)}`}>{currentScore}</div>
            <p className="text-xs text-muted-foreground">out of 100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Mood Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{getMoodTrend()}</div>
            <p className="text-xs text-muted-foreground">past week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
              <Moon className="w-4 h-4" />
              <span>Sleep Quality</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{getSleepQuality()}</div>
            <p className="text-xs text-muted-foreground">past week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Entries</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{moodData.length}</div>
            <p className="text-xs text-muted-foreground">in selected period</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Wellness Score Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <LineChart className="w-5 h-5" />
              <span>Wellness Score Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                Track your overall wellness score progression over time
              </p>
            </div>
            <LineChartComponent data={wellnessScores.map(score => ({ date: score.date, score: score.score }))} />
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Your wellness score over the past {timeRange === "7d" ? "7" : timeRange === "30d" ? "30" : "90"} days
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Mood Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="w-5 h-5" />
              <span>Mood Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                Breakdown of your mood patterns over the selected period
              </p>
            </div>
            <PieChartComponent data={getMoodDistribution()} />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Sleep vs Mood Correlation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Sleep vs Mood</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                Visualize your sleep patterns and quality over time
              </p>
            </div>
            <BarChartComponent data={sleepData.slice(-5).map(sleep => ({ date: sleep.date, hours: sleep.hours, quality: sleep.quality }))} />
          </CardContent>
        </Card>

        {/* Factor Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Factor Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {wellnessScores.length > 0 ? (
              <div className="space-y-4">
                {Object.entries(wellnessScores[wellnessScores.length - 1].factors).map(([factor, score]) => (
                  <div key={factor}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{factor}</span>
                      <span className="font-medium">{score}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getScoreBgColor(score)}`}
                        style={{ width: `${score}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span>Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getWellnessInsights().map((insight, index) => (
                <div key={index} className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Personalized Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Based on your mood trends:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Try the breathing exercises when feeling anxious</li>
                <li>• Practice gratitude journaling daily</li>
                <li>• Consider meditation for better sleep quality</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Wellness goals:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Aim for 7-9 hours of sleep consistently</li>
                <li>• Track your mood patterns weekly</li>
                <li>• Celebrate small wins and progress</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WellnessAnalytics;
