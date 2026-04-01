import { useEffect } from "react";
import { apiUrl, parseJsonResponse } from "@/lib/api";

interface ReminderSettings {
  drinkWaterEnabled: boolean;
  drinkWaterIntervalMins: number;
  sleepRoutineEnabled: boolean;
  sleepTime: string;
  breakReminderEnabled: boolean;
  breakIntervalMins: number;
  moodCheckinEnabled: boolean;
  moodCheckinTimes: string;
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

const SETTINGS_STORAGE_KEY = "allSmartWellnessReminders";
const DAILY_SENT_STORAGE_KEY = "allSmartReminderDailySent";
const ACHIEVEMENT_SENT_STORAGE_KEY = "allAchievementMilestoneSent";
const SETTINGS_UPDATED_EVENT = "smart-reminders-updated";
const SOCIAL_SETTINGS_STORAGE_KEY = "allHumanSocialSettings";
const SOCIAL_SETTINGS_UPDATED_EVENT = "human-social-updated";

const DEFAULT_SOCIAL_SETTINGS: SocialInteractionSettings = {
  dailyGreetingsEnabled: true,
  greetingTime: "08:00",
  mealCheckEnabled: true,
  mealCheckTimes: "09:00, 14:00, 20:00",
  eventWishesEnabled: true,
  eventWishTime: "09:00",
  eventDates: "01-01:New Year, 08-15:Independence Day, 10-02:Gandhi Jayanti, 12-25:Christmas",
  achievementCelebrationEnabled: true,
};

const getUserId = (): string | null => {
  try {
    const backendUser = JSON.parse(localStorage.getItem("backendUser") || "{}");
    return backendUser?.id || backendUser?._id || null;
  } catch {
    return null;
  }
};

const parseTimeList = (value: string): string[] => {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(item));
};

const parseEventList = (value: string): Array<{ date: string; label: string }> => {
  return value
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
};

const parseSettingsForUser = (userId: string): ReminderSettings => {
  try {
    const allSettings = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || "{}");
    const userSettings = allSettings[userId] || {};
    return {
      ...DEFAULT_SETTINGS,
      ...userSettings,
      drinkWaterIntervalMins: Math.max(30, Number(userSettings.drinkWaterIntervalMins) || DEFAULT_SETTINGS.drinkWaterIntervalMins),
      breakIntervalMins: Math.max(20, Number(userSettings.breakIntervalMins) || DEFAULT_SETTINGS.breakIntervalMins),
      moodCheckinTimes: typeof userSettings.moodCheckinTimes === "string" ? userSettings.moodCheckinTimes : DEFAULT_SETTINGS.moodCheckinTimes,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const parseSocialSettingsForUser = (userId: string): SocialInteractionSettings => {
  try {
    const allSocialSettings = JSON.parse(localStorage.getItem(SOCIAL_SETTINGS_STORAGE_KEY) || "{}");
    const userSettings = allSocialSettings[userId] || {};
    return {
      ...DEFAULT_SOCIAL_SETTINGS,
      ...userSettings,
      mealCheckTimes:
        typeof userSettings.mealCheckTimes === "string"
          ? userSettings.mealCheckTimes
          : DEFAULT_SOCIAL_SETTINGS.mealCheckTimes,
      eventDates:
        typeof userSettings.eventDates === "string" ? userSettings.eventDates : DEFAULT_SOCIAL_SETTINGS.eventDates,
    };
  } catch {
    return DEFAULT_SOCIAL_SETTINGS;
  }
};

const syncPreferencesFromBackend = async (userId: string) => {
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

    if (data?.smartWellnessReminders) {
      const allReminderSettings = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || "{}");
      allReminderSettings[userId] = {
        ...DEFAULT_SETTINGS,
        ...data.smartWellnessReminders,
      };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(allReminderSettings));
    }

    if (data?.humanSocialInteraction) {
      const allSocialSettings = JSON.parse(localStorage.getItem(SOCIAL_SETTINGS_STORAGE_KEY) || "{}");
      allSocialSettings[userId] = {
        ...DEFAULT_SOCIAL_SETTINGS,
        ...data.humanSocialInteraction,
      };
      localStorage.setItem(SOCIAL_SETTINGS_STORAGE_KEY, JSON.stringify(allSocialSettings));
    }
  } catch {
    // Continue with locally available settings if backend sync fails.
  }
};

const ensureNotificationPermission = async () => {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    try {
      await Notification.requestPermission();
    } catch {
      // Ignore permission request failures silently.
    }
  }
};

const sendNotification = (title: string, body: string) => {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    new Notification(title, { body });
  } catch {
    // Some browsers may block repeated notification bursts.
  }
};

const logEngagementEvent = async (
  category: "wellness-reminder" | "social-interaction" | "mood-scanner",
  eventType: string,
  title: string,
  message: string,
  metadata: Record<string, unknown> = {},
) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) return;

    await fetch(apiUrl("/api/engagement/log"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ category, eventType, title, message, metadata }),
    });
  } catch {
    // Ignore logging failures silently.
  }
};

const shouldFireDailyReminder = (userId: string, reminderKey: string, dateKey: string): boolean => {
  try {
    const allSent = JSON.parse(localStorage.getItem(DAILY_SENT_STORAGE_KEY) || "{}");
    if (!allSent[userId]) allSent[userId] = {};

    if (allSent[userId][reminderKey] === dateKey) {
      return false;
    }

    allSent[userId][reminderKey] = dateKey;
    localStorage.setItem(DAILY_SENT_STORAGE_KEY, JSON.stringify(allSent));
    return true;
  } catch {
    return true;
  }
};

const getDateKey = (now: Date): string => {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
};

const getMonthDateKey = (now: Date): string => {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");
  return `${month}-${date}`;
};

const getMoodStreak = (userId: string): number => {
  try {
    const allMoods = JSON.parse(localStorage.getItem("allMoodEntries") || "{}");
    const moods = Array.isArray(allMoods[userId]) ? allMoods[userId] : [];
    const uniqueDays = new Set(moods.map((entry: { date?: string }) => new Date(entry.date || "").toDateString()));
    return uniqueDays.size;
  } catch {
    return 0;
  }
};

const shouldFireAchievementMilestone = (userId: string, milestone: number): boolean => {
  try {
    const allSent = JSON.parse(localStorage.getItem(ACHIEVEMENT_SENT_STORAGE_KEY) || "{}");
    if (!allSent[userId]) allSent[userId] = {};
    if (allSent[userId][milestone]) return false;

    allSent[userId][milestone] = true;
    localStorage.setItem(ACHIEVEMENT_SENT_STORAGE_KEY, JSON.stringify(allSent));
    return true;
  } catch {
    return true;
  }
};

const WellnessReminderScheduler = () => {
  useEffect(() => {
    let timerIds: number[] = [];

    const clearTimers = () => {
      timerIds.forEach((id) => window.clearInterval(id));
      timerIds = [];
    };

    const setupScheduler = async () => {
      clearTimers();

      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
      if (!isLoggedIn) return;

      const userId = getUserId();
      if (!userId) return;

      await syncPreferencesFromBackend(userId);

      const settings = parseSettingsForUser(userId);
      const socialSettings = parseSocialSettingsForUser(userId);

      const hasAnyReminderEnabled =
        settings.drinkWaterEnabled || settings.sleepRoutineEnabled || settings.breakReminderEnabled || settings.moodCheckinEnabled;
      const hasAnySocialEnabled =
        socialSettings.dailyGreetingsEnabled ||
        socialSettings.mealCheckEnabled ||
        socialSettings.eventWishesEnabled ||
        socialSettings.achievementCelebrationEnabled;

      if (!hasAnyReminderEnabled && !hasAnySocialEnabled) return;
      await ensureNotificationPermission();

      if (settings.drinkWaterEnabled) {
        const waterId = window.setInterval(() => {
          const title = "Hydration Reminder";
          const message = "Time to drink water and recharge.";
          sendNotification(title, message);
          logEngagementEvent("wellness-reminder", "drink-water", title, message, {
            intervalMins: settings.drinkWaterIntervalMins,
          });
        }, settings.drinkWaterIntervalMins * 60 * 1000);
        timerIds.push(waterId);
      }

      if (settings.breakReminderEnabled) {
        const breakId = window.setInterval(() => {
          const title = "Break Reminder";
          const message = "Take a short break: stretch, breathe, and relax your eyes.";
          sendNotification(title, message);
          logEngagementEvent("wellness-reminder", "break", title, message, {
            intervalMins: settings.breakIntervalMins,
          });
        }, settings.breakIntervalMins * 60 * 1000);
        timerIds.push(breakId);
      }

      const moodTimes = parseTimeList(settings.moodCheckinTimes);
      const mealTimes = parseTimeList(socialSettings.mealCheckTimes);
      const events = parseEventList(socialSettings.eventDates);
      const milestoneLevels = [3, 7, 14, 30, 60, 100];

      const dailyWatcherId = window.setInterval(() => {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        const currentTime = `${hh}:${mm}`;
        const dateKey = getDateKey(now);
        const monthDateKey = getMonthDateKey(now);

        try {
          const backendUser = JSON.parse(localStorage.getItem("backendUser") || "{}");
          const userName = backendUser?.name || "there";

          if (socialSettings.dailyGreetingsEnabled && socialSettings.greetingTime === currentTime) {
            const reminderKey = `greeting-${socialSettings.greetingTime}`;
            if (shouldFireDailyReminder(userId, reminderKey, dateKey)) {
              const title = "Daily Greeting";
              const message = `Hi ${userName}, hope your day goes great. Stay positive.`;
              sendNotification(title, message);
              logEngagementEvent("social-interaction", "daily-greeting", title, message, {
                time: socialSettings.greetingTime,
              });
            }
          }

          if (socialSettings.mealCheckEnabled && mealTimes.includes(currentTime)) {
            const reminderKey = `meal-${currentTime}`;
            if (shouldFireDailyReminder(userId, reminderKey, dateKey)) {
              const title = "Meal Check";
              const message = "Quick check: Did you have your meal? Nourish and hydrate well.";
              sendNotification(title, message);
              logEngagementEvent("social-interaction", "meal-check", title, message, {
                time: currentTime,
              });
            }
          }

          if (socialSettings.eventWishesEnabled && socialSettings.eventWishTime === currentTime) {
            const eventToday = events.find((event) => event.date === monthDateKey);
            if (eventToday) {
              const reminderKey = `event-${eventToday.date}-${eventToday.label}`;
              if (shouldFireDailyReminder(userId, reminderKey, dateKey)) {
                const title = "Special Event Wish";
                const message = `Happy ${eventToday.label}, ${userName}. Wishing you joy and peace.`;
                sendNotification(title, message);
                logEngagementEvent("social-interaction", "event-wish", title, message, {
                  event: eventToday.label,
                  date: eventToday.date,
                });
              }
            }
          }

          if (socialSettings.achievementCelebrationEnabled) {
            const streak = getMoodStreak(userId);
            if (milestoneLevels.includes(streak) && shouldFireAchievementMilestone(userId, streak)) {
              const title = "Achievement Unlocked";
              const message = `Amazing ${streak}-day mood streak. Keep growing, ${userName}.`;
              sendNotification(title, message);
              logEngagementEvent("social-interaction", "achievement", title, message, {
                streak,
              });
            }
          }
        } catch {
          // Skip social reminder cycle if user data parsing fails.
        }

        if (settings.sleepRoutineEnabled && settings.sleepTime === currentTime) {
          const reminderKey = `sleep-${settings.sleepTime}`;
          if (shouldFireDailyReminder(userId, reminderKey, dateKey)) {
            const title = "Sleep Routine Reminder";
            const message = "Wind down now so your sleep routine stays consistent.";
            sendNotification(title, message);
            logEngagementEvent("wellness-reminder", "sleep-routine", title, message, {
              time: settings.sleepTime,
            });
          }
        }

        if (settings.moodCheckinEnabled && moodTimes.includes(currentTime)) {
          const reminderKey = `mood-${currentTime}`;
          if (shouldFireDailyReminder(userId, reminderKey, dateKey)) {
            const title = "Mood Check-in";
            const message = "Quick pause: log your mood and check in with yourself.";
            sendNotification(title, message);
            logEngagementEvent("wellness-reminder", "mood-checkin", title, message, {
              time: currentTime,
            });
          }
        }
      }, 30 * 1000);

      timerIds.push(dailyWatcherId);
    };

    const handleRefresh = () => {
      setupScheduler();
    };

    setupScheduler();
    window.addEventListener(SETTINGS_UPDATED_EVENT, handleRefresh);
    window.addEventListener(SOCIAL_SETTINGS_UPDATED_EVENT, handleRefresh);
    window.addEventListener("storage", handleRefresh);

    return () => {
      clearTimers();
      window.removeEventListener(SETTINGS_UPDATED_EVENT, handleRefresh);
      window.removeEventListener(SOCIAL_SETTINGS_UPDATED_EVENT, handleRefresh);
      window.removeEventListener("storage", handleRefresh);
    };
  }, []);

  return null;
};

export default WellnessReminderScheduler;
