import React, { useEffect, useMemo, useState } from "react";
import { BellRing, Coffee, Moon, Save, Timer, Smile, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiUrl, parseJsonResponse } from "@/lib/api";

interface SmartWellnessRemindersProps {
  userId: string | null;
  userName: string;
}

interface ReminderSettings {
  drinkWaterEnabled: boolean;
  drinkWaterIntervalMins: number;
  sleepRoutineEnabled: boolean;
  sleepTime: string;
  breakReminderEnabled: boolean;
  breakIntervalMins: number;
  moodCheckinEnabled: boolean;
  moodCheckinTimes: string;
  lastUpdated?: string;
}

const DEFAULT_SETTINGS: ReminderSettings = {
  drinkWaterEnabled: true,
  drinkWaterIntervalMins: 120,
  sleepRoutineEnabled: true,
  sleepTime: "22:30",
  breakReminderEnabled: true,
  breakIntervalMins: 60,
  moodCheckinEnabled: true,
  moodCheckinTimes: "09:00, 14:00, 21:00",
};

const STORAGE_KEY = "allSmartWellnessReminders";
const SETTINGS_UPDATED_EVENT = "smart-reminders-updated";

const SmartWellnessReminders: React.FC<SmartWellnessRemindersProps> = ({ userId, userName }) => {
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_SETTINGS);
  const [statusMessage, setStatusMessage] = useState<string>("");

  useEffect(() => {
    const loadSettings = async () => {
      if (!userId) {
        setSettings(DEFAULT_SETTINGS);
        return;
      }

      const allReminderSettings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const userSettings = allReminderSettings[userId];
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
        if (!data?.smartWellnessReminders) return;

        const merged = { ...DEFAULT_SETTINGS, ...data.smartWellnessReminders };
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

  const parsedMoodTimes = useMemo(() => {
    return settings.moodCheckinTimes
      .split(",")
      .map((item) => item.trim())
      .filter((item) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(item));
  }, [settings.moodCheckinTimes]);

  const saveSettings = async () => {
    if (!userId) {
      setStatusMessage("User login required. Please login again.");
      return;
    }

    const safeSettings = {
      ...settings,
      drinkWaterIntervalMins: Math.max(30, Number(settings.drinkWaterIntervalMins) || 120),
      breakIntervalMins: Math.max(20, Number(settings.breakIntervalMins) || 60),
      moodCheckinTimes: settings.moodCheckinTimes
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .join(", "),
      lastUpdated: new Date().toISOString(),
    };

    const allReminderSettings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    allReminderSettings[userId] = safeSettings;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allReminderSettings));
    window.dispatchEvent(new Event(SETTINGS_UPDATED_EVENT));
    setSettings(safeSettings);

    const token = localStorage.getItem("jwtToken");
    if (!token) {
      setStatusMessage("Smart reminder settings saved locally.");
      return;
    }

    try {
      const response = await fetch(apiUrl("/api/preferences"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ smartWellnessReminders: safeSettings }),
      });

      if (!response.ok) {
        setStatusMessage("Saved locally. Cloud save failed right now.");
        return;
      }

      setStatusMessage("Smart reminder settings saved to cloud and local.");
    } catch {
      setStatusMessage("Saved locally. Cloud save failed right now.");
    }
  };

  const sendTestReminder = async (title: string, body: string) => {
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

  const reminderPlan = [
    settings.drinkWaterEnabled ? `Drink water every ${settings.drinkWaterIntervalMins} mins` : null,
    settings.sleepRoutineEnabled ? `Sleep reminder at ${settings.sleepTime}` : null,
    settings.breakReminderEnabled ? `Take a break every ${settings.breakIntervalMins} mins` : null,
    settings.moodCheckinEnabled
      ? `Mood check-in at ${parsedMoodTimes.length > 0 ? parsedMoodTimes.join(", ") : "custom times"}`
      : null,
  ].filter(Boolean);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-card to-serenity-soft p-5 shadow-serenity-lg sm:p-7 animate-fade-in">
      <div className="pointer-events-none absolute -left-12 -top-12 h-32 w-32 rounded-full bg-primary/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-14 -right-12 h-36 w-36 rounded-full bg-accent/15 blur-2xl" />

      <div className="relative z-10 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              <BellRing className="h-3.5 w-3.5" />
              Smart Wellness Reminders
            </div>
            <h3 className="mt-2 text-2xl font-bold leading-tight text-foreground sm:text-3xl">
              Personalized reminder routine for {userName || "you"}
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Configure your hydration, sleep, break, and mood check-in reminders in one place.
            </p>
          </div>
          <Button
            onClick={saveSettings}
            className="h-11 bg-gradient-to-r from-primary to-accent font-semibold text-white shadow-serenity transition-all hover:brightness-110"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Reminders
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
                <Coffee className="h-4 w-4 text-primary" />
                Drink Water
              </p>
              <input
                type="checkbox"
                checked={settings.drinkWaterEnabled}
                onChange={(e) => setSettings((prev) => ({ ...prev, drinkWaterEnabled: e.target.checked }))}
              />
            </div>
            <label className="text-xs text-muted-foreground">Interval (minutes)</label>
            <input
              type="number"
              min={30}
              value={settings.drinkWaterIntervalMins}
              onChange={(e) => setSettings((prev) => ({ ...prev, drinkWaterIntervalMins: Number(e.target.value) }))}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <Button
              variant="outline"
              className="mt-3 w-full"
              onClick={() => sendTestReminder("Hydration Reminder", "Time to drink water and refresh your body.")}
            >
              Send Test
            </Button>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/70 p-4 backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Moon className="h-4 w-4 text-primary" />
                Sleep Routine
              </p>
              <input
                type="checkbox"
                checked={settings.sleepRoutineEnabled}
                onChange={(e) => setSettings((prev) => ({ ...prev, sleepRoutineEnabled: e.target.checked }))}
              />
            </div>
            <label className="text-xs text-muted-foreground">Sleep reminder time</label>
            <input
              type="time"
              value={settings.sleepTime}
              onChange={(e) => setSettings((prev) => ({ ...prev, sleepTime: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <Button
              variant="outline"
              className="mt-3 w-full"
              onClick={() => sendTestReminder("Sleep Routine Reminder", "Start winding down for your sleep schedule.")}
            >
              Send Test
            </Button>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/70 p-4 backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Timer className="h-4 w-4 text-primary" />
                Break Reminder
              </p>
              <input
                type="checkbox"
                checked={settings.breakReminderEnabled}
                onChange={(e) => setSettings((prev) => ({ ...prev, breakReminderEnabled: e.target.checked }))}
              />
            </div>
            <label className="text-xs text-muted-foreground">Interval (minutes)</label>
            <input
              type="number"
              min={20}
              value={settings.breakIntervalMins}
              onChange={(e) => setSettings((prev) => ({ ...prev, breakIntervalMins: Number(e.target.value) }))}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <Button
              variant="outline"
              className="mt-3 w-full"
              onClick={() => sendTestReminder("Break Reminder", "Take a short break: stand, stretch, and relax your eyes.")}
            >
              Send Test
            </Button>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/70 p-4 backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Smile className="h-4 w-4 text-primary" />
                Mood Check-in
              </p>
              <input
                type="checkbox"
                checked={settings.moodCheckinEnabled}
                onChange={(e) => setSettings((prev) => ({ ...prev, moodCheckinEnabled: e.target.checked }))}
              />
            </div>
            <label className="text-xs text-muted-foreground">Times (HH:MM, comma separated)</label>
            <input
              type="text"
              value={settings.moodCheckinTimes}
              onChange={(e) => setSettings((prev) => ({ ...prev, moodCheckinTimes: e.target.value }))}
              placeholder="09:00, 14:00, 21:00"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <Button
              variant="outline"
              className="mt-3 w-full"
              onClick={() => sendTestReminder("Mood Check-in", "Pause for a minute and log how you feel right now.")}
            >
              Send Test
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">Active Reminder Plan</p>
          {reminderPlan.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reminder is active yet.</p>
          ) : (
            <div className="space-y-2">
              {reminderPlan.map((item, index) => (
                <p key={`${item}-${index}`} className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {item}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartWellnessReminders;
