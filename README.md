# 🌸 Mood Nest

### A Voice-Enabled AI Mental Wellness Companion

Mood Nest is a full-stack mental wellness platform where users can track emotions, reflect daily, use AI-powered wellness tools, and receive personalized support in a safe, supportive flow.

---

## ✨ Implemented Highlights

- 🤖 **Mindful Buddy Chatbot** with Gemini-based responses.
- 😊 **Mood Tracker** with mood selection, intensity scale, notes, and history.
- 💡 **Mood Suggestions + AI Insights** from mood, intensity, and note context.
- 🧠 **Saved AI Suggestions** stored with entries and shown in history.
- 🧘 **Meditation & Breathing** sessions with timer, controls, and completion tracking.
- 📝 **Wellness Journal** with gratitude, goals, streaks, and achievements.
- 📊 **Wellness Analytics** with trend windows (7/30/90 days).
- 🚨 **Crisis Support** with emergency resources and safety planning.
- 🧭 **Feature Navbar** sticky navigation across all feature pages.

### 🆕 New AI-Powered Features

- 📱 **Mood Scanner** - Real-time emotion detection and energy assessment.
- 🎨 **Mood-to-Art** - AI-generated artistic representations of moods.
- 🍽️ **Mind-Gut Recommendation Engine** - Voice-enabled AI food recommendations based on mood with nutritional info.
- ☀️ **Daily Zen** - Personalized morning briefing with voice playback, weather awareness, and daily action checklist.
- 📊 **Comprehensive Wellness Report** - Aggregated digest of all wellness activities with **PDF export**.
- ⏰ **Smart Wellness Reminders** - Customizable reminders for mood tracking, journaling, meditation, and social engagement.
- 🤝 **Social Interaction Features** - Community engagement settings and activity logging.
- 📈 **Engagement & Activity Logging** - Automatic event tracking across all wellness activities.

---

## 🛠️ Tech Stack

### Frontend
- **React 18** + TypeScript, Vite build system
- **UI System:** Tailwind CSS, shadcn/ui, Lucide Icons (70+ icons)
- **Voice APIs:** Web Speech (SpeechRecognition + SpeechSynthesis)
- **PDF Export:** jsPDF for report generation
- **Router:** React Router v7 with state management

### Backend
- **Runtime:** Node.js with Express.js server (port 8120)
- **Database:** MongoDB + Mongoose ODM
- **Authentication:** JWT-based token auth with middleware
- **AI Engine:** Google Generative AI (Gemini 2.5 Flash)
- **File Upload:** Multer for profile images

---

## 🔌 API Endpoints

**Authentication:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

**Core Features:**
- `/api/moods` - Mood tracking
- `/api/journal` - Wellness journaling
- `/api/chats` - Chatbot conversations
- `/api/analytics` - Wellness analytics

**New Features:**
- `/api/mood-scanner` - Emotion detection (POST /detect, GET /history)
- `/api/mood-art` - Artistic mood generation (POST /generate, GET /history)
- `/api/mind-gut` - Food recommendations (POST /suggest, GET /history)
- `/api/daily-zen` - Morning briefings (POST /generate, GET /history)
- `/api/preferences` - User settings (GET, POST)
- `/api/engagement` - Activity logging (POST, GET /history)

---

## 🗄️ Data Strategy

- **Primary Persistence:** MongoDB for authenticated, user-linked records (10+ collections)
- **Fallback/Continuity:** User-scoped LocalStorage cache for offline experiences
- **AI Fallback:** Intelligent fallback responses when Gemini API unavailable:
  - Auth errors trigger rule-based responses
  - Missing API key uses mood-based defaults
  - Parsing errors use template responses

---

## 🎯 Key Features Breakdown

### 1. Voice-Enabled Input/Output
- **Speech-to-Text:** Mic button on Mind-Gut page (en-IN locale for Hindi+English mix)
- **Text-to-Speech:** Daily Zen automatic voice briefing playback with play/stop controls

### 2. AI-Powered Recommendations
- Food recommendations (Mind-Gut) with meal timing, nutrients, hydration tips
- Morning briefings (Daily Zen) with weather context, motivation, action plan
- Art generation (Mood-to-Art) for visual mood expression
- Mood detection (Scanner) for emotion + energy assessment

### 3. Comprehensive Reporting
- **Activity Dashboard:** Counters for moods, journal, chats, scans, art, recommendations, briefings, engagement logs
- **Latest Highlights:** Recent entries from each feature category
- **Preferences Snapshot:** Current settings for reminders and social sharing
- **AI Insights:** Summarized wellness narrative with action recommendations
- **PDF Export:** Downloadable wellness report document

### 4. Wellness Customization
- Smart reminder toggles (mood tracking, journaling, meditation, social)
- Social interaction settings (share mood, like posts, comment, receive encouragement)
- Preference persistence to MongoDB

---

## 🧭 App Routes

| Route | Feature | Features |
|-------|---------|----------|
| `/` | Landing page | Hero, CTA |
| `/login` | User authentication | Login with JWT |
| `/signup` | User registration | Account creation |
| `/dashboard` | Main wellness hub | Quick access, menu navigation |
| `/mood-tracker` | Mood + Scanner + Art | Track mood, detect emotions, visualize mood as art |
| `/meditation` | Meditation sessions | Guided sessions with timer |
| `/journal` | Wellness journal | Gratitude, goals, reflections |
| `/analytics` | Wellness trends | Mood trends, sleep insights, 7/30/90d filters |
| `/crisis-support` | Emergency resources | Hotlines, safety planning |
| `/mind-gut` | Food recommendations | Voice input, meal suggestions, history |
| `/profile` | User wellness hub | 4 tabs: Report, Reminders, Social, Daily Zen |

---

## 🔗 Repository

https://github.com/rameshwarisandile/Miniproject.git

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ with npm
- MongoDB connection string in `.env`
- Google Generative AI API key in `.env`

### Installation

```bash
# Frontend setup
npm install
npm run dev  # Starts on port 5173/8081

# Backend setup (in /server directory)
cd server
npm install
npm start    # Starts on port 8120
```

### Environment Variables (.env in root and server)

```env
# Server/.env
PORT=8120
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
KEY=your_google_generative_ai_api_key
```

---

## 💡 How It Works

1. **User registers/logs in** with JWT authentication
2. **Tracks mood** with intensity, notes, AI suggestions
3. **Generates mood art** for visual emotion representation
4. **Receives mind-gut recommendations** with voice input
5. **Gets daily zen briefing** with voice output
6. **Views comprehensive report** with all activities + PDF export
7. **Configures reminders** and social settings
8. **Logs meditation, journal entries, and social actions**
9. **Views wellness analytics** with trend analysis
10. **Accesses crisis support** and emergency resources

---

## ⚖️ Architecture Highlights

- **Microservice-style routing:** Each feature has dedicated route file
- **JWT authentication:** Middleware protects all new endpoints
- **MongoDB schemas:** Dedicated models for each feature (MoodGutSuggestion, DailyZenBriefing, etc.)
- **Gemini AI integration:** Centralized with fallback patterns
- **Voice APIs:** Browser-native Web Speech with language selection
- **Component reusability:** shadcn/ui provides consistent UI across 70+ components

---

## ⚠️ Important Notes

- 🔒 **Data Privacy:** All user data encrypted and user-scoped
- 🤖 **AI Limitations:** Gemini responses are suggestions, not medical advice
- 🚨 **Mental Health Support:** Mood Nest enhances wellness routines but is NOT a replacement for professional medical care
- 📱 **Voice Support:** Requires HTTPS in production (browser Web Speech API requirement)
- 🌐 **Browser Support:** Modern browsers (Chrome, Safari, Edge) for voice and PDF features

---

## 🎯 Next Steps & Future Enhancements

- Real-time notifications for reminders
- Wearable device integration (sleep data sync)
- Community mood maps and trends
- Multi-language support (currently en-IN)
- Offline-first progressive web app (PWA) capabilities
- Advanced ML model for mood pattern prediction
