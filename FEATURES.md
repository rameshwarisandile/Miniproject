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

---

## 🏗️ Backend, Data, and AI

### Backend Stack
- Node.js + Express API server.
- MongoDB + Mongoose for persistent data.
- JWT-protected routes.
- Multer integration for upload handling.

### AI Integration
- Google Generative AI (Gemini) via `/api/ask`.

### Persistence Strategy
- **Primary:** MongoDB (authenticated user data).
- **Fallback:** User-scoped LocalStorage cache.

---

## 🧩 Frontend Stack

- React 18 + TypeScript + Vite.
- Tailwind CSS + shadcn/ui.
- React Router-based navigation.
- Lucide icon system.

---

## 🗺️ Implemented App Routes

- `/`
- `/login`
- `/signup`
- `/dashboard`
- `/mood-tracker`
- `/meditation`
- `/journal`
- `/analytics`
- `/crisis-support`
