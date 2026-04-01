const mongoose = require("mongoose");

const userPreferenceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    smartWellnessReminders: {
      type: {
        drinkWaterEnabled: { type: Boolean, default: true },
        drinkWaterIntervalMins: { type: Number, default: 120 },
        sleepRoutineEnabled: { type: Boolean, default: true },
        sleepTime: { type: String, default: "22:30" },
        breakReminderEnabled: { type: Boolean, default: true },
        breakIntervalMins: { type: Number, default: 60 },
        moodCheckinEnabled: { type: Boolean, default: true },
        moodCheckinTimes: { type: String, default: "09:00, 14:00, 21:00" },
        lastUpdated: { type: String },
      },
      default: {},
    },
    humanSocialInteraction: {
      type: {
        dailyGreetingsEnabled: { type: Boolean, default: true },
        greetingTime: { type: String, default: "08:00" },
        mealCheckEnabled: { type: Boolean, default: true },
        mealCheckTimes: { type: String, default: "09:00, 14:00, 20:00" },
        eventWishesEnabled: { type: Boolean, default: true },
        eventWishTime: { type: String, default: "09:00" },
        eventDates: {
          type: String,
          default: "01-01:New Year, 08-15:Independence Day, 10-02:Gandhi Jayanti, 12-25:Christmas",
        },
        achievementCelebrationEnabled: { type: Boolean, default: true },
        lastUpdated: { type: String },
      },
      default: {},
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("UserPreference", userPreferenceSchema);
