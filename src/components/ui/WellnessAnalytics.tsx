import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Activity, Calendar, Target, BarChart3, PieChart, LineChart, Moon, Zap } from "lucide-react";
import FeatureNavbar from "@/components/ui/FeatureNavbar";

type TimeRange = "7d" | "30d" | "90d";

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
  mood?: string;
}

interface JournalApiEntry {
  date: string;
  mood?: string;
  sleepQuality?: "excellent" | "good" | "fair" | "poor" | "";
  sleepHours?: number | null;
}

interface MoodApiEntry {
  mood: string;
  note?: string;
  createdAt?: string;
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

const moodIntensityMap: Record<string, number> = {
  happy: 0.9,
  calm: 0.85,
  excited: 0.88,
  grateful: 0.9,
  tired: 0.5,
  anxious: 0.4,
  sad: 0.35,
  angry: 0.3,
};

const sleepQualityScore: Record<SleepData["quality"], number> = {
  excellent: 95,
  good: 80,
  fair: 65,
  poor: 45,
};

const sleepQualityFromHours = (hours: number): SleepData["quality"] => {
  if (hours >= 8) return "excellent";
  if (hours >= 7) return "good";
  if (hours >= 6) return "fair";
  return "poor";
};

const normalizeMood = (mood: string) => mood.toLowerCase();

const daysFromTimeRange = (range: TimeRange) => {
  if (range === "7d") return 7;
  if (range === "30d") return 30;
  return 90;
};

const filterByRange = <T extends { date: string }>(items: T[], range: TimeRange) => {
  const days = daysFromTimeRange(range);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return items
    .filter((item) => new Date(item.date) >= cutoff)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const PieChartComponent = ({ data }: { data: { mood: string; percentage: number }[] }) => {
  if (data.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No data available</div>;
  }

  const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#F97316", "#06B6D4", "#84CC16"];
  const radius = 84;
  const centerX = 110;
  const centerY = 110;

  let currentAngle = -Math.PI / 2;
  const slices = data.map((item, index) => {
    const angle = (item.percentage / 100) * 2 * Math.PI;
    const x1 = centerX + radius * Math.cos(currentAngle);
    const y1 = centerY + radius * Math.sin(currentAngle);
    const x2 = centerX + radius * Math.cos(currentAngle + angle);
    const y2 = centerY + radius * Math.sin(currentAngle + angle);
    const largeArcFlag = angle > Math.PI ? 1 : 0;
    const d = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      "Z",
    ].join(" ");

    const midAngle = currentAngle + angle / 2;
    const labelRadius = radius * 0.62;
    const labelX = centerX + labelRadius * Math.cos(midAngle);
    const labelY = centerY + labelRadius * Math.sin(midAngle);
    currentAngle += angle;

    return {
      key: item.mood,
      color: colors[index % colors.length],
      d,
      labelX,
      labelY,
      percentage: Math.round(item.percentage),
      mood: item.mood,
    };
  });

  return (
    <div className="flex flex-col items-center">
      <svg width="220" height="220" viewBox="0 0 220 220">
        {slices.map((slice) => (
          <path key={slice.key} d={slice.d} fill={slice.color} stroke="white" strokeWidth="2" />
        ))}
        {slices.map((slice) =>
          slice.percentage >= 8 ? (
            <text
              key={`${slice.key}-label`}
              x={slice.labelX}
              y={slice.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize="12"
              fontWeight="700"
            >
              {slice.percentage}%
            </text>
          ) : null,
        )}
      </svg>
      <div className="grid grid-cols-2 gap-2 text-xs mt-2">
        {slices.map((slice) => (
          <div key={`${slice.key}-legend`} className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: slice.color }} />
            <span className="capitalize">{slice.mood}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const LineChartComponent = ({ data }: { data: { date: string; score: number }[] }) => {
  if (data.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No data available</div>;
  }

  if (data.length === 1) {
    const point = data[0];
    return (
      <div className="flex flex-col items-center py-6">
        <svg width={240} height={160}>
          <line x1={30} y1={130} x2={210} y2={130} stroke="#E5E7EB" strokeWidth="2" />
          <circle cx={120} cy={70} r="7" fill="#3B82F6" stroke="white" strokeWidth="2" />
          <text x={120} y={52} textAnchor="middle" className="text-xs fill-foreground font-medium">
            {point.score}
          </text>
          <text x={120} y={148} textAnchor="middle" className="text-xs fill-muted-foreground">
            {new Date(point.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </text>
        </svg>
        <p className="text-sm text-muted-foreground mt-2">Only one data point available, add more entries to see a trend line.</p>
      </div>
    );
  }

  const width = 400;
  const height = 200;
  const padding = 40;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;

  const maxScore = Math.max(...data.map((d) => d.score));
  const minScore = Math.min(...data.map((d) => d.score));
  const scoreRange = Math.max(1, maxScore - minScore);

  const points = data.map((item, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((item.score - minScore) / scoreRange) * chartHeight;
    return { x, y };
  });

  const pathData = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return (
    <div className="flex flex-col items-center overflow-x-auto">
      <svg width={width} height={height} className="mb-4">
        {[0, 25, 50, 75, 100].map((score) => {
          const y = padding + chartHeight - ((score - minScore) / scoreRange) * chartHeight;
          return <line key={score} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="5,5" />;
        })}
        <path d={pathData} fill="none" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point, index) => (
          <circle key={index} cx={point.x} cy={point.y} r="4" fill="#3B82F6" stroke="white" strokeWidth="2" />
        ))}
      </svg>
    </div>
  );
};

const BarChartComponent = ({ data }: { data: { date: string; hours: number; quality: SleepData["quality"] }[] }) => {
  if (data.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No sleep data available</div>;
  }

  const maxHours = Math.max(1, ...data.map((d) => d.hours));
  const barWidth = 30;
  const barSpacing = 10;
  const chartHeight = 150;
  const padding = 40;

  const qualityColors = {
    excellent: "#10B981",
    good: "#3B82F6",
    fair: "#F59E0B",
    poor: "#EF4444",
  };

  return (
    <div className="flex flex-col items-center overflow-x-auto">
      <svg width={data.length * (barWidth + barSpacing) + 2 * padding} height={chartHeight + 2 * padding}>
        {data.map((item, index) => {
          const barHeight = (item.hours / maxHours) * chartHeight;
          const x = padding + index * (barWidth + barSpacing);
          const y = padding + chartHeight - barHeight;

          return (
            <g key={index}>
              <rect x={x} y={y} width={barWidth} height={barHeight} fill={qualityColors[item.quality]} rx="3" />
              <text x={x + barWidth / 2} y={padding + chartHeight + 15} textAnchor="middle" className="text-xs fill-muted-foreground">
                {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </text>
              <text x={x + barWidth / 2} y={y - 5} textAnchor="middle" className="text-xs fill-foreground font-medium">
                {item.hours.toFixed(1)}h
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const WellnessAnalytics = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [moodData, setMoodData] = useState<MoodData[]>([]);
  const [sleepData, setSleepData] = useState<SleepData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const token = localStorage.getItem("jwtToken");
      const loggedInUser = JSON.parse(localStorage.getItem("backendUser") || "{}");
      const userId = loggedInUser?.id || loggedInUser?._id || null;

      let moods: MoodData[] = [];
      let sleeps: SleepData[] = [];

      if (token) {
        try {
          const [moodsRes, journalRes] = await Promise.all([
            fetch("/api/moods", { headers: { Authorization: `Bearer ${token}` } }),
            fetch("/api/journal", { headers: { Authorization: `Bearer ${token}` } }),
          ]);

          if (moodsRes.ok) {
            const moodApiData: MoodApiEntry[] = await moodsRes.json();
            moods = moodApiData.map((item) => {
              const mood = normalizeMood(item.mood || "");
              return {
                date: new Date(item.createdAt || new Date().toISOString()).toISOString().split("T")[0],
                mood,
                intensity: moodIntensityMap[mood] ?? 0.6,
                note: item.note,
              };
            });
          }

          if (journalRes.ok) {
            const journalApiData: JournalApiEntry[] = await journalRes.json();
            sleeps = journalApiData
              .filter((entry) => entry.sleepQuality || typeof entry.sleepHours === "number")
              .map((entry) => {
                const hours = typeof entry.sleepHours === "number" ? entry.sleepHours : 0;
                const quality = entry.sleepQuality ? entry.sleepQuality : sleepQualityFromHours(hours || 6.5);
                return {
                  date: entry.date,
                  hours: hours || 6.5,
                  quality,
                  mood: entry.mood,
                };
              });
          }
        } catch (error) {
          console.error("Failed to fetch analytics from API", error);
        }
      }

      if (moods.length === 0 && userId) {
        const allMoodEntries = JSON.parse(localStorage.getItem("allMoodEntries") || "{}");
        const localMoods = allMoodEntries[userId] || [];
        moods = localMoods.map((item: any) => {
          const mood = normalizeMood(item.mood || "");
          return {
            date: new Date(item.date).toISOString().split("T")[0],
            mood,
            intensity: moodIntensityMap[mood] ?? Math.min(1, Math.max(0.2, (Number(item.intensity) || 5) / 10)),
            note: item.note,
          };
        });
      }

      if (sleeps.length === 0 && userId) {
        const allJournal = JSON.parse(localStorage.getItem("allWellnessJournal") || "{}");
        const localEntries = allJournal[userId] || [];
        sleeps = localEntries
          .filter((entry: any) => entry.sleepQuality || typeof entry.sleepHours === "number")
          .map((entry: any) => {
            const hours = typeof entry.sleepHours === "number" ? entry.sleepHours : 0;
            const quality = entry.sleepQuality ? entry.sleepQuality : sleepQualityFromHours(hours || 6.5);
            return {
              date: entry.date,
              hours: hours || 6.5,
              quality,
              mood: entry.mood,
            };
          });
      }

      setMoodData(filterByRange(moods, timeRange));
      setSleepData(filterByRange(sleeps, timeRange));
      setLoading(false);
    };

    loadData();
  }, [timeRange]);

  const wellnessScores = useMemo<WellnessScore[]>(() => {
    const scoreMap: Record<string, WellnessScore["factors"]> = {};

    moodData.forEach((item) => {
      const current = scoreMap[item.date] || { mood: 65, sleep: 70, activity: 65, social: 70 };
      current.mood = Math.round((item.intensity || 0.6) * 100);
      scoreMap[item.date] = current;
    });

    sleepData.forEach((item) => {
      const current = scoreMap[item.date] || { mood: 65, sleep: 70, activity: 65, social: 70 };
      current.sleep = sleepQualityScore[item.quality];
      scoreMap[item.date] = current;
    });

    return Object.entries(scoreMap)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, factors]) => ({
        date,
        factors,
        score: Math.round((factors.mood + factors.sleep + factors.activity + factors.social) / 4),
      }));
  }, [moodData, sleepData]);

  const currentScore = wellnessScores.length > 0 ? wellnessScores[wellnessScores.length - 1].score : 0;

  const getMoodTrend = () => {
    if (moodData.length < 2) return "stable";
    const recent = moodData.slice(-7);
    const midpoint = Math.floor(recent.length / 2);
    const first = recent.slice(0, midpoint);
    const second = recent.slice(midpoint);
    const firstAvg = first.reduce((sum, item) => sum + item.intensity, 0) / Math.max(1, first.length);
    const secondAvg = second.reduce((sum, item) => sum + item.intensity, 0) / Math.max(1, second.length);

    if (secondAvg > firstAvg + 0.08) return "improving";
    if (secondAvg < firstAvg - 0.08) return "declining";
    return "stable";
  };

  const getSleepQuality = () => {
    if (sleepData.length === 0) return "unknown";

    const recent = sleepData.slice(-7);
    const qualityOrder: SleepData["quality"][] = ["poor", "fair", "good", "excellent"];
    const avg = recent.reduce((sum, item) => sum + qualityOrder.indexOf(item.quality), 0) / recent.length;
    return qualityOrder[Math.round(avg)] || "unknown";
  };

  const moodDistribution = useMemo(() => {
    if (moodData.length === 0) return [];
    const counts: Record<string, number> = {};
    moodData.forEach((item) => {
      counts[item.mood] = (counts[item.mood] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([mood, count]) => ({ mood, count, percentage: (count / moodData.length) * 100 }))
      .sort((a, b) => b.count - a.count);
  }, [moodData]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const insights = useMemo(() => {
    const list: string[] = [];
    const moodTrend = getMoodTrend();
    if (moodTrend === "improving") list.push("Your mood has improved over the last week.");
    if (moodTrend === "declining") list.push("Mood trend is slightly down. Consider daily check-ins and relaxation routines.");

    const sleepQuality = getSleepQuality();
    if (sleepQuality === "excellent") list.push("Sleep quality is excellent and helping your overall wellness.");
    if (sleepQuality === "poor") list.push("Sleep quality is low. Try consistent bed and wake timings.");

    if (currentScore >= 80) list.push("Excellent wellness score. Keep this rhythm.");
    else if (currentScore >= 60) list.push("Good score. Small consistency improvements can push it higher.");
    else list.push("Wellness score is low right now. Focus on sleep and mood routine first.");

    return list.length > 0 ? list : ["Add mood and journal entries regularly to unlock personalized insights."];
  }, [currentScore, moodData, sleepData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-serenity-soft relative">
      <FeatureNavbar featureName="📊 Wellness Analytics" />
      <div className="pointer-events-none absolute top-4 -left-16 w-56 h-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-16 -right-12 w-72 h-72 rounded-full bg-pink-500/10 blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">

        <div className="mb-8 page-hero-shell">
          <div className="text-center">
            <h1 className="page-hero-title mb-3 text-gradient-primary">Wellness Analytics</h1>
            <p className="page-hero-subtitle">Track your progress and discover patterns in your wellness journey</p>
          </div>
        </div>

      <div className="flex justify-center mb-8">
        <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
          <SelectTrigger className="w-52 border-2 border-primary/60 bg-card/90 rounded-xl text-base font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card className="card-elevated bg-card/85 border-serenity-calm/35">
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

        <Card className="card-elevated bg-card/85 border-serenity-calm/35">
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

        <Card className="card-elevated bg-card/85 border-serenity-calm/35">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
              <Moon className="w-4 h-4" />
              <span>Sleep Quality</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{getSleepQuality()}</div>
            <p className="text-xs text-muted-foreground">from journal entries</p>
          </CardContent>
        </Card>

        <Card className="card-elevated bg-card/85 border-serenity-calm/35">
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
        <Card className="card-elevated bg-card/85 border-serenity-calm/35">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <LineChart className="w-5 h-5" />
              <span>Wellness Score Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">Track your overall wellness score progression over time</p>
            </div>
            <LineChartComponent data={wellnessScores.map((item) => ({ date: item.date, score: item.score }))} />
          </CardContent>
        </Card>

        <Card className="card-elevated bg-card/85 border-serenity-calm/35">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="w-5 h-5" />
              <span>Mood Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">Mood percentages are shown inside the pie slices</p>
            </div>
            <PieChartComponent data={moodDistribution} />
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <Card className="card-elevated bg-card/85 border-serenity-calm/35">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Sleep vs Mood</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">Sleep entries fetched from journal and stored in database</p>
            </div>
            <BarChartComponent data={sleepData.slice(-7).map((item) => ({ date: item.date, hours: item.hours, quality: item.quality }))} />
          </CardContent>
        </Card>

        <Card className="card-elevated bg-card/85 border-serenity-calm/35">
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
                    <div className="w-full bg-muted/60 rounded-full h-2">
                      <div className={`h-2 rounded-full ${getScoreBgColor(score)}`} style={{ width: `${score}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            )}
          </CardContent>
        </Card>

        <Card className="card-elevated bg-card/85 border-serenity-calm/35">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span>Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div key={index} className="p-3 bg-primary/10 border border-primary/25 rounded-lg">
                  <p className="text-sm text-primary-foreground/95">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {loading && <p className="text-center text-sm text-muted-foreground">Loading analytics...</p>}
      </div>
    </div>
  );
};

export default WellnessAnalytics;