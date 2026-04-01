# 🚀 Mood Nest - Feature Overview (Implemented)

This document lists only the features currently implemented in the project.

---

## 🌟 Core Modules

### 1. 🔐 Authentication & Access
- User registration and login.
- JWT-based authorization for protected routes.
- Profile image upload support.

### 2. 🏠 Dashboard
- Main hub after login.
- Quick access to all wellness modules.
- User-focused overview and navigation.

### 3. 😊 Mood Tracker (`/mood-tracker`)
- 8 mood options with emoji support.
- Mood intensity scale (`1-10`).
- Optional note for context.
- Rule-based suggestions for selected mood.
- AI suggestions using mood + intensity + note.
- AI suggestions saved with each mood entry.
- Expand/collapse AI tips in recent mood history.
- User-scoped mood history persistence.

### 4. 🧘 Meditation & Breathing (`/meditation`)
- Guided meditation/breathing session flows.
- Timer-based progress handling.
- Session control actions (play/pause/skip).
- Completed sessions history persistence.

### 5. 📝 Wellness Journal (`/journal`)
- Gratitude logging.
- Reflection and mood capture.
- Goal setting and progress tracking.
- Streak logic and achievements.
- User-scoped journal persistence.

### 6. 📊 Wellness Analytics (`/analytics`)
- Wellness score visualization.
- Mood trend insights.
- Sleep-related insight handling from journal records.
- Time filters: `7d`, `30d`, `90d`.
- API-first load with local fallback support.

### 7. 🚨 Crisis Support (`/crisis-support`)
- Emergency resources and hotline access.
- Personal emergency contact management.
- Safety plan item creation and management.

### 8. 🤖 AI Chatbot (Mindful Buddy)
- Wellness-focused chat interface.
- Gemini-powered backend AI responses.
- Chat persistence support.
- Voice-enabled chatbot interaction flow.

### 9. 🧭 Feature Navbar System
- Shared navbar for major feature pages.
- Sticky behavior while scrolling.
- Feature-specific page titles.
- Quick dashboard navigation actions.

### 10. 📱 Mood Scanner (`/mood-tracker`)
- Real-time emotion detection and analysis.
- Energy level assessment.
- Wellbeing prompts and insights.
- AI-powered emotion recognition from user input.
- Scan history with timestamp tracking.
- Source differentiation (AI vs fallback).

### 11. 🎨 Mood-to-Art (`/mood-tracker`)
- AI-generated artistic representations of moods.
- Mood title and summary generation.
- Visual mood expression through AI art.
- Art generation history persistence.
- Gemini-powered creative responses with fallback.

### 12. 🍽️ Mind-Gut Recommendation Engine (`/mind-gut`)
- AI-powered food recommendations based on mood description.
- Voice input support (speech-to-text).
- Meal timing suggestions (Breakfast/Lunch/Dinner/Snacks).
- Nutritional information for each recommendation.
- Hydration tips linked to mood state.
- Foods to avoid for specific moods.
- Recommendation history with mood tracking.
- Gemini-powered with intelligent fallback (mood-based rules).

### 13. ☀️ Daily Zen (Personalized Morning Briefing) (`/profile?tab=zen`)
- AI-generated personalized morning voice briefing.
- Weather-aware motivation tailored to location.
- Sleep hours integration with wellness context.
- Mood streak tracking for motivation.
- Action checklist for daily wellness goals.
- Voice synthesis for audio briefing playback.
- Recovery line based on sleep quality.
- Briefing history with voice playback.
- Gemini-powered with poetic fallback generation.

### 14. ⏰ Smart Wellness Reminders (`/profile?tab=reminders`)
- Customizable reminder toggles for 4 wellness activities:
  - Mood tracking reminders
  - Journal reflection reminders
  - Meditation session reminders
  - Social interaction reminders
- User preference persistence to backend.
- Smart scheduling based on user preferences.

### 15. 🤝 Human-Like Social Interaction (`/profile?tab=social`)
- Social engagement settings:
  - Share mood with community
  - Like/support peer entries
  - Comment on wellness posts
  - Receive community encouragement
- User preference configuration.
- Social interaction history logging.
- Engagement analytics.

### 16. 📊 Comprehensive Wellness Report (`/profile?tab=report`)
- Aggregated report of all wellness activities.
- Feature activity counters for:
  - Mood entries logged
  - Conversation exchanges
  - Journal reflections
  - Mood scans performed
  - Art generations created
  - Mind-Gut recommendations received
  - Daily Zen briefings generated
  - Engagement events logged
- Latest highlights showcase (last entry from each feature).
- Preferences snapshot (reminders + social settings).
- AI-powered insights and action recommendations.
- **PDF Export** functionality with:
  - Feature activity summary
  - Latest highlights for each category
  - User preferences snapshot
  - AI wellness insights
  - Downloadable report document

### 17. 📈 Engagement & Activity Logging
- Automatic event logging for user interactions.
- Event categories: mood, journal, meditation, chat, social, reminders, scans, art, mind-gut, daily-zen.
- Engagement history with timestamps.
- Event metadata capture for detailed insights.

### 18. ⚙️ User Preferences & Settings
- Centralized preference management.
- Smart reminders configuration.
- Social interaction settings.
- Preference persistence to MongoDB.
- Profile page access with 4-tab interface:
  - **Report Tab** - Wellness digest
  - **Reminders Tab** - Wellness reminders configuration
  - **Social Tab** - Community interaction settings
  - **Zen Tab** - Daily morning briefing

---

## 🏗️ Backend, Data, and AI

### Backend Stack
- Node.js + Express API server on port 8120.
- MongoDB + Mongoose for persistent data.
- JWT-protected routes with authMiddleware.
- Multer integration for upload handling.

### AI Integration
- Google Generative AI (Gemini 2.5 Flash) for:
  - Mood suggestions and AI tips
  - Mood Scanner emotion detection
  - Mood-to-Art creative responses
  - Mind-Gut food recommendations
  - Daily Zen morning briefings
  - Report AI insights and recommendations
- Intelligent fallback mechanisms for all Gemini API calls:
  - Auth error fallback (mood-based or rule-based responses)
  - Missing API key fallback
  - Parsing error fallback

### Persistence Strategy
- **Primary:** MongoDB (authenticated user data with collections):
  - `users` - User accounts and profiles
  - `moods` - Mood entries
  - `chats` - Chat messages
  - `journals` - Journal entries
  - `moodScannerScans` - Emotion detection scans
  - `moodArtGenerations` - AI art representations
  - `mindGutSuggestions` - Food recommendations
  - `dailyZenBriefings` - Morning briefings
  - `preferences` - User settings and reminders
  - `engagementLogs` - Activity tracking
- **Fallback:** User-scoped LocalStorage cache for smoother offline continuity.

### API Endpoints Summary
- `/api/auth` - Authentication (login/signup/logout)
- `/api/moods` - Mood tracking and history
- `/api/journal` - Wellness journal management
- `/api/chats` - Chatbot conversations
- `/api/analytics` - Wellness analytics and insights
- `/api/mood-scanner` - Emotion detection APIs
- `/api/mood-art` - Artistic mood generation
- `/api/mind-gut` - Food recommendations
- `/api/daily-zen` - Morning briefing generation
- `/api/preferences` - User settings and reminders
- `/api/engagement` - Event logging and history

---

## 🧩 Frontend Stack

- React 18 + TypeScript + Vite (port 5173/8081).
- Tailwind CSS + shadcn/ui component system.
- React Router v7 for navigation and state management.
- Lucide icon library (70+ icons used).
- Web Speech API:
  - SpeechRecognition for voice input (en-IN locale for Hindi+English)
  - SpeechSynthesis for voice output/voice briefing playback
- jsPDF for report PDF generation
- Local Storage for user-scoped data caching

---

## 🗺️ Implemented App Routes

- `/` - Landing page
- `/login` - User login
- `/signup` - User registration
- `/dashboard` - Main wellness hub
- `/mood-tracker` - Mood tracking + Scanner + Mood-to-Art
- `/meditation` - Meditation & breathing sessions
- `/journal` - Wellness journal with goals & gratitude
- `/analytics` - Wellness analytics & trends
- `/crisis-support` - Emergency resources
- `/mind-gut` - Food recommendations based on mood
- `/profile` - User profile hub with 4 tabs:
  - `?tab=report` - Comprehensive wellness report (default)
  - `?tab=reminders` - Smart reminders configuration
  - `?tab=social` - Social interaction settings
  - `?tab=zen` - Daily Zen morning briefing

---

## 🔊 Voice Features

- **Voice Input (Speech-to-Text):**
  - Mic button on Mind-Gut page for mood description
  - Browser SpeechRecognition API (en-IN language)
  - Real-time transcript display
  - Permission handling and browser compatibility checks

- **Voice Output (Text-to-Speech):**
  - Daily Zen briefing automatic voice playback
  - Manual play/stop controls for voice
  - Natural language speech synthesis (en-IN accent)
  - Error handling for browser compatibility

---

## 🎯 Data Flow & Architecture

### Front-to-Back Flow
1. User performs wellness action (track mood, generate briefing, etc.)
2. Frontend collects data + fetches AI insights via API
3. Backend processes request with JWT auth
4. Gemini API called for AI generation (with fallback logic)
5. Result stored in MongoDB
6. Response returned to frontend with source tag (ai/fallback-auth/fallback)
7. Frontend displays result + stores in LocalStorage cache
8. Activity logged to engagement system

### Offline Continuity
- LocalStorage acts as read cache for historical data
- New entries fail gracefully if backend unavailable
- User sees last-known state from cache
- Sync happens automatically when backend reconnects
