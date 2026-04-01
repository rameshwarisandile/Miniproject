
import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ReportGenerator from "@/components/ui/ReportGenerator";
import SmartWellnessReminders from "@/components/ui/SmartWellnessReminders";
import HumanLikeSocialInteraction from "@/components/ui/HumanLikeSocialInteraction";
import DailyZenBriefing from "@/components/ui/DailyZenBriefing";
import FeatureNavbar from "@/components/ui/FeatureNavbar";
import { BellRing, FileText, HandHeart, Sunrise } from "lucide-react";
import { useSearchParams } from "react-router-dom";

const ProfilePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeView, setActiveView] = useState<"report" | "reminders" | "social" | "zen">(
    searchParams.get("tab") === "reminders"
      ? "reminders"
      : searchParams.get("tab") === "social"
        ? "social"
        : searchParams.get("tab") === "zen"
          ? "zen"
          : "report",
  );
  const backendUser = JSON.parse(localStorage.getItem("backendUser") || '{}');
  const userId = backendUser?.id || backendUser?._id || null;
  const userName = backendUser?.name || "User";

  useEffect(() => {
    const tab = searchParams.get("tab");
    setActiveView(tab === "reminders" ? "reminders" : tab === "social" ? "social" : tab === "zen" ? "zen" : "report");
  }, [searchParams]);

  const switchView = (view: "report" | "reminders" | "social" | "zen") => {
    setActiveView(view);
    setSearchParams({ tab: view === "reminders" ? "reminders" : view === "social" ? "social" : view === "zen" ? "zen" : "report" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-serenity-soft">
      <FeatureNavbar
        featureName={
          activeView === "report"
            ? "📄 Report"
            : activeView === "reminders"
              ? "⏰ Smart Reminders"
              : activeView === "social"
                ? "🤝 Social Interaction"
                : "🌅 The Daily Zen"
        }
      />

      <div className="mx-auto w-full max-w-5xl px-4 py-8 space-y-5">
        <Card className="card-elevated w-full border-primary/20 bg-card/80 shadow-serenity-lg backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Button
                onClick={() => switchView("report")}
                className={`h-12 text-sm font-semibold ${
                  activeView === "report"
                    ? "bg-gradient-to-r from-primary to-accent text-white"
                    : "bg-card border border-primary/30 text-foreground"
                }`}
              >
                <FileText className="mr-2 h-4 w-4" />
                Daily Report
              </Button>

              <Button
                onClick={() => switchView("reminders")}
                className={`h-12 text-sm font-semibold ${
                  activeView === "reminders"
                    ? "bg-gradient-to-r from-primary to-accent text-white"
                    : "bg-card border border-primary/30 text-foreground"
                }`}
              >
                <BellRing className="mr-2 h-4 w-4" />
                Smart Wellness Reminders
              </Button>

              <Button
                onClick={() => switchView("social")}
                className={`h-12 text-sm font-semibold ${
                  activeView === "social"
                    ? "bg-gradient-to-r from-primary to-accent text-white"
                    : "bg-card border border-primary/30 text-foreground"
                }`}
              >
                <HandHeart className="mr-2 h-4 w-4" />
                Human-Like Interaction
              </Button>

              <Button
                onClick={() => switchView("zen")}
                className={`h-12 text-sm font-semibold ${
                  activeView === "zen"
                    ? "bg-gradient-to-r from-primary to-accent text-white"
                    : "bg-card border border-primary/30 text-foreground"
                }`}
              >
                <Sunrise className="mr-2 h-4 w-4" />
                The Daily Zen
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated w-full border-primary/20 bg-card/80 shadow-serenity-lg backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-gradient-primary">
              {activeView === "report"
                ? "Report"
                : activeView === "reminders"
                  ? "Smart Wellness Reminders"
                  : activeView === "social"
                    ? "Human-Like Social Interaction"
                    : "The Daily Zen"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeView === "report" ? (
              <ReportGenerator userId={userId} userName={userName} />
            ) : activeView === "reminders" ? (
              <SmartWellnessReminders userId={userId} userName={userName} />
            ) : activeView === "social" ? (
              <HumanLikeSocialInteraction userId={userId} userName={userName} />
            ) : (
              <DailyZenBriefing userId={userId} userName={userName} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
