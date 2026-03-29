# 🌸 Mood Nest

### A Voice Enabled AI Mental Wellness Companion

Mood Nest is a full-stack mental wellness platform where users can track emotions, reflect daily, use guided wellness tools, and receive AI-powered support in a safe, supportive flow.

---

## ✨ Implemented Highlights

- 🤖 **Mindful Buddy Chatbot** with Gemini-based responses.
- 😊 **Mood Tracker** with mood selection, intensity scale, notes, and history.
- 💡 **Mood Suggestions + AI Suggestions** from mood, intensity, and note context.
- 🧠 **Saved AI Suggestions** stored with entries and shown in history with expand/collapse.
- 🧘 **Meditation & Breathing** sessions with timer, controls, and completion tracking.
- 📝 **Wellness Journal** with gratitude, goals, streaks, and achievements.
- 📊 **Wellness Analytics** with trend windows (7/30/90 days).
- 🚨 **Crisis Support** with emergency resources and safety planning.
- 🧭 **Sticky Unified Feature Navbar** across feature pages.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **UI System:** Tailwind CSS, shadcn/ui, Lucide Icons
- **Backend:** Node.js, Express
- **Database:** MongoDB + Mongoose
- **Authentication:** JWT
- **AI Engine:** Google Generative AI (Gemini)

---

## 🔌 API Endpoints Used

- `/api/auth`
- `/api/moods`
- `/api/journal`
- `/api/chats`
- `/api/analytics`
- `/api/ask`

---

## 🗄️ Data Strategy

- **Primary Persistence:** MongoDB for authenticated, user-linked records
- **Fallback/Continuity:** User-scoped LocalStorage cache for smoother continuity

---

## 🧭 App Routes

- `/`
- `/login`
- `/signup`
- `/dashboard`
- `/mood-tracker`
- `/meditation`
- `/journal`
- `/analytics`
- `/crisis-support`

---

## 🚀 Run Locally

### Frontend
1. Install dependencies (project root).
2. Start frontend:

```bash
npm run dev
```

### Backend
1. Open `server` folder.
2. Install dependencies.
3. Add `.env` values:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `KEY` (Gemini API key)
   - `PORT`
4. Start server:

```bash
npm run dev
# or
npm start
```

---

## 🔗 Repository

https://github.com/rameshwarisandile/Miniproject.git

---

## ⚠️ Note

Mood Nest supports mental wellness routines, but it is not a replacement for professional medical care. In crisis situations, contact emergency services or your local crisis helpline immediately.
