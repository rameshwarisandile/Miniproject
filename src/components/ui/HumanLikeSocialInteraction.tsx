import React, { useEffect, useMemo, useState } from "react";
import { BellRing, CalendarDays, HandHeart, Save, Sparkles, Trophy, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiUrl, parseJsonResponse } from "@/lib/api";

interface HumanLikeSocialInteractionProps {
  userId: string | null;
  userName: string;
}

interface SocialInteractionSettings {
  dailyGreetingsEnabled: boolean;
  greetingTime: string;
  mealCheckEnabled: boolean;
  mealCheckTimes: string;
  eventWishesEnabled: boolean;
  eventWishTime: string;
  eventDates: string;
  achievementCelebrationEnabled: boolean;
  lastUpdated?: string;
}

const DEFAULT_SETTINGS: SocialInteractionSettings = {
  dailyGreetingsEnabled: true,
  greetingTime: "08:00",
  mealCheckEnabled: true,
  mealCheckTimes: "09:00, 14:00, 20:00",
  eventWishesEnabled: true,
  eventWishTime: "09:00",
  eventDates: "01-01:New Year, 08-15:Independence Day, 10-02:Gandhi Jayanti, 12-25:Christmas",
  achievementCelebrationEnabled: true,
};

const STORAGE_KEY = "allHumanSocialSettings";
const SETTINGS_UPDATED_EVENT = "human-social-updated";

const HumanLikeSocialInteraction: React.FC<HumanLikeSocialInteractionProps> = ({ userId, userName }) => {
  const [settings, setSettings] = useState<SocialInteractionSettings>(DEFAULT_SETTINGS);
  const [statusMessage, setStatusMessage] = useState<string>("");

  useEffect(() => {
    const loadSettings = async () => {
      if (!userId) {
        setSettings(DEFAULT_SETTINGS);
        return;
      }

      const allSettings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const userSettings = allSettings[userId];
      const localSettings = userSettings ? { ...DEFAULT_SETTINGS, ...userSettings } : DEFAULT_SETTINGS;
      setSettings(localSettings);

      const token = localStorage.getItem("jwtToken");
      if (!token) return;

      try {
        const response = await fetch(apiUrl("/api/preferences"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return;
        const data = await parseJsonResponse(response, "Unable to parse preferences response");
        if (!data?.humanSocialInteraction) return;

        const merged = { ...DEFAULT_SETTINGS, ...data.humanSocialInteraction };
        const updatedLocal = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        updatedLocal[userId] = merged;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLocal));
        setSettings(merged);
      } catch {
        // Keep local settings if cloud sync fails.
      }
    };

    loadSettings();

    return () => {
      // No cleanup needed.
    };
  }, [userId]);

  const parsedMealTimes = useMemo(() => {
    return settings.mealCheckTimes
      .split(",")
      .map((item) => item.trim())
      .filter((item) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(item));
  }, [settings.mealCheckTimes]);

  const parsedEvents = useMemo(() => {
    return settings.eventDates
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const [datePart, ...rest] = item.split(":");
        return {
          date: (datePart || "").trim(),
          label: rest.join(":").trim() || "Special Day",
        };
      })
      .filter((item) => /^\d{2}-\d{2}$/.test(item.date));
  }, [settings.eventDates]);

  const saveSettings = async () => {
    if (!userId) {
      setStatusMessage("User login required. Please login again.");
      return;
    }

    const safeSettings: SocialInteractionSettings = {
      ...settings,
      mealCheckTimes: settings.mealCheckTimes
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .join(", "),
      eventDates: settings.eventDates
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .join(", "),
      lastUpdated: new Date().toISOString(),
    };

    const allSettings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    allSettings[userId] = safeSettings;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allSettings));
    window.dispatchEvent(new Event(SETTINGS_UPDATED_EVENT));
    setSettings(safeSettings);

    const token = localStorage.getItem("jwtToken");
    if (!token) {
      setStatusMessage("Human-like interaction settings saved locally.");
      return;
    }

    try {
      const response = await fetch(apiUrl("/api/preferences"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ humanSocialInteraction: safeSettings }),
      });

      if (!response.ok) {
        setStatusMessage("Saved locally. Cloud save failed right now.");
        return;
      }

      setStatusMessage("Human-like interaction settings saved to cloud and local.");
    } catch {
      setStatusMessage("Saved locally. Cloud save failed right now.");
    }
  };

  const sendTestNotification = async (title: string, body: string) => {
    try {
      if (!("Notification" in window)) {
        alert(`${title}\n\n${body}`);
        return;
      }

      if (Notification.permission === "granted") {
        new Notification(title, { body });
        return;
      }

      if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          new Notification(title, { body });
          return;
        }
      }

      alert(`${title}\n\n${body}`);
    } catch {
      alert(`${title}\n\n${body}`);
    }
  };

  const planItems = [
    settings.dailyGreetingsEnabled ? `Daily greeting at ${settings.greetingTime}` : null,
    settings.mealCheckEnabled ? `Meal checks at ${parsedMealTimes.join(", ") || "custom times"}` : null,
    settings.eventWishesEnabled ? `Event wishes at ${settings.eventWishTime}` : null,
    settings.achievementCelebrationEnabled ? "Achievement celebrations enabled" : null,
  ].filter(Boolean);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-card to-serenity-soft p-5 shadow-serenity-lg sm:p-7 animate-fade-in">
      <div className="pointer-events-none absolute -left-12 -top-12 h-32 w-32 rounded-full bg-primary/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-14 -right-12 h-36 w-36 rounded-full bg-accent/15 blur-2xl" />

      <div className="relative z-10 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              <HandHeart className="h-3.5 w-3.5" />
              Human-Like Social Interaction
            </div>
            <h3 className="mt-2 text-2xl font-bold leading-tight text-foreground sm:text-3xl">
              Personal social check-ins for {userName || "you"}
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Daily greetings, meal check prompts, event wishes, and achievement celebrations.
            </p>
          </div>

          <Button
            onClick={saveSettings}
            className="h-11 bg-gradient-to-r from-primary to-accent font-semibold text-white shadow-serenity transition-all hover:brightness-110"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </div>

        {statusMessage && (
          <div className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            {statusMessage}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-card/70 p-4 backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <BellRing className="h-4 w-4 text-primary" />
                Daily Greetings
              </p>
              <input
                type="checkbox"
                checked={settings.dailyGreetingsEnabled}
                onChange={(e) => setSettings((prev) => ({ ...prev, dailyGreetingsEnabled: e.target.checked }))}
              />
            </div>
            <label className="text-xs text-muted-foreground">Greeting time</label>
            <input
              type="time"
              value={settings.greetingTime}
              onChange={(e) => setSettings((prev) => ({ ...prev, greetingTime: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <Button
              variant="outline"
              className="mt-3 w-full"
              onClick={() => sendTestNotification("Good Morning", `Hi ${userName}, have a peaceful and productive day.`)}
            >
              Send Test Greeting
            </Button>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/70 p-4 backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Utensils className="h-4 w-4 text-primary" />
                Meal Check-ins
              </p>
              <input
                type="checkbox"
                checked={settings.mealCheckEnabled}
                onChange={(e) => setSettings((prev) => ({ ...prev, mealCheckEnabled: e.target.checked }))}
              />
            </div>
            <label className="text-xs text-muted-foreground">Meal check times (HH:MM, comma separated)</label>
            <input
              type="text"
              value={settings.mealCheckTimes}
              onChange={(e) => setSettings((prev) => ({ ...prev, mealCheckTimes: e.target.value }))}
              placeholder="09:00, 14:00, 20:00"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <Button
              variant="outline"
              className="mt-3 w-full"
              onClick={() => sendTestNotification("Meal Check", "Quick check: kya aapne meal liya? Please hydrate too.")}
            >
              Send Test Meal Check
            </Button>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/70 p-4 backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <CalendarDays className="h-4 w-4 text-primary" />
                Event Wishes
              </p>
              <input
                type="checkbox"
                checked={settings.eventWishesEnabled}
                onChange={(e) => setSettings((prev) => ({ ...prev, eventWishesEnabled: e.target.checked }))}
              />
            </div>
            <label className="text-xs text-muted-foreground">Wish time</label>
            <input
              type="time"
              value={settings.eventWishTime}
              onChange={(e) => setSettings((prev) => ({ ...prev, eventWishTime: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <label className="mt-3 block text-xs text-muted-foreground">Events (MM-DD:Event, comma separated)</label>
            <input
              type="text"
              value={settings.eventDates}
              onChange={(e) => setSettings((prev) => ({ ...prev, eventDates: e.target.value }))}
              placeholder="01-01:New Year, 08-15:Independence Day"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <Button
              variant="outline"
              className="mt-3 w-full"
              onClick={() => sendTestNotification("Special Day Wish", `Happy celebration day, ${userName}. Stay joyful.`)}
            >
              Send Test Event Wish
            </Button>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/70 p-4 backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Trophy className="h-4 w-4 text-primary" />
                Achievement Celebrations
              </p>
              <input
                type="checkbox"
                checked={settings.achievementCelebrationEnabled}
                onChange={(e) => setSettings((prev) => ({ ...prev, achievementCelebrationEnabled: e.target.checked }))}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Auto celebration notifications on mood streak milestones: 3, 7, 14, 30, 60, 100 days.
            </p>
            <Button
              variant="outline"
              className="mt-3 w-full"
              onClick={() => sendTestNotification("Achievement Unlocked", "Amazing consistency. Keep this streak going.")}
            >
              Send Test Achievement
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-4 w-4" />
            Active Social Plan
          </p>
          {planItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No social interaction automation is active.</p>
          ) : (
            <div className="space-y-2">
              {planItems.map((item, index) => (
                <p key={`${item}-${index}`} className="text-sm text-foreground">
                  {item}
                </p>
              ))}
            </div>
          )}

          {parsedEvents.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Parsed events: {parsedEvents.map((item) => `${item.date} ${item.label}`).join(" | ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HumanLikeSocialInteraction;
