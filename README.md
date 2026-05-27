<div align="center">

# 🗺️ Learn Path

**A full-stack learning tracker that turns any goal into a phased roadmap — with daily check-ins, learn notes, and AI-powered planning.**

![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)
![Firebase](https://img.shields.io/badge/Firebase-Hosting%20%2B%20Firestore-ff9800?style=flat-square&logo=firebase)
![Gemini](https://img.shields.io/badge/Gemini-AI%20Roadmap-4285f4?style=flat-square&logo=google)
![Vite](https://img.shields.io/badge/Vite-6-646cff?style=flat-square&logo=vite)

</div>

---

## ✨ Features

- **AI Roadmap Generation** — Enter a project name, goal, and daily commitment. Gemini designs a phased plan (14–90 days) with milestones tailored to your pace.
- **Daily Tracker** — A visual day-grid. Click any day to select it, then hit **Check-in** to mark it done or open the **log panel** to write what you did.
- **Learn Notes** — Each day supports multiple structured notes tagged `#Do`, `#Don't`, `#Insight`, or any custom hashtag you define.
- **Notes Summary** — All learn notes grouped and filterable by tag inside each project.
- **Multi-project Dashboard** — See all running projects with progress bars, streaks, and current phase at a glance.
- **Real-time Sync** — Firestore keeps data in sync. Refresh anytime, on any device.
- **Responsive** — Works on mobile and desktop. Sidebar nav on desktop, bottom nav on mobile.

---

## 🖥️ Screenshots

| Dashboard | Project Detail | Daily Log |
|-----------|---------------|-----------|
| All projects with progress | Day grid + phases + notes | Log panel with learn notes |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite |
| Styling | Custom CSS (glassmorphism, Poppins + Roboto) |
| Database | Cloud Firestore (real-time) |
| Auth | Firebase Anonymous Authentication |
| Hosting | Firebase Hosting |
| AI | Google Gemini 2.0 Flash via Cloud Function |
| API Security | Firebase Functions Secrets (key never in browser) |

---

## 🚀 Deploy in 6 Steps

### Prerequisites
- Node.js 20+
- Firebase CLI: `npm install -g firebase-tools`
- A [Firebase project](https://console.firebase.google.com)
- A [Google AI Studio](https://aistudio.google.com/app/apikey) API key

---

### Step 1 — Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/learn-path.git
cd learn-path

npm install

cd functions && npm install && cd ..
```

---

### Step 2 — Create Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project** → name it `learn-path`
2. **Firestore** → Create database → choose a region → Start in production mode
3. **Authentication** → Get started → enable **Anonymous**
4. **Project Settings** → Add app → **Web** → register → copy the config object

---

### Step 3 — Configure environment

```bash
cp .env.example .env
```

Fill in `.env` with your Firebase Web App config:

```env
VITE_FB_API_KEY=AIzaSy...
VITE_FB_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FB_PROJECT_ID=your-project-id
VITE_FB_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FB_MESSAGING_SENDER_ID=123456789012
VITE_FB_APP_ID=1:123456789012:web:xxxxxxxxxxxx
```

> **Note:** The Firebase web `apiKey` is safe in client code — it only identifies the project.
> Security is enforced by Firestore Rules. Your **Gemini key** is handled separately in Step 5.

---

### Step 4 — Link Firebase

```bash
firebase login
firebase use --add   # select your project, alias as "default"
```

---

### Step 5 — Set Gemini API key (server-side only)

```bash
firebase functions:secrets:set GEMINI_KEY
# Paste your Gemini API key when prompted. It is stored encrypted
# in Google Cloud Secret Manager and never sent to the browser.
```

---

### Step 6 — Build and deploy

```bash
npm run build
firebase deploy
```

Firebase will output your live URL:

```
✔  Hosting URL: https://your-project.web.app
```

---

## 📁 Project Structure

```
learn-path/
├── index.html                  # HTML entry
├── package.json                # Frontend dependencies
├── vite.config.js              # Vite config
├── firebase.json               # Firebase hosting + functions
├── firestore.rules             # Security rules (per-user access)
├── firestore.indexes.json
├── .env.example                # Copy to .env and fill in
├── public/
│   └── favicon.svg
├── src/
│   ├── main.jsx                # React entry point
│   ├── App.jsx                 # Main app — all views and state
│   ├── firebase.js             # Firebase client init + auth
│   ├── styles.css              # Global stylesheet
│   └── utils/
│       ├── firestore.js        # Firestore CRUD (projects, logs, days)
│       ├── helpers.js          # pct(), streak(), allNotes(), tagColor()
│       └── roadmap.js          # Calls Cloud Function with local fallback
└── functions/
    ├── package.json
    └── index.js                # generateRoadmap (Gemini, secret-protected)
```

---

## 🗄️ Firestore Data Model

```
users/{uid}/projects/{projectId}
  ├─ name:        "Push up mastery"
  ├─ goal:        "100 consecutive push-ups"
  ├─ commitment:  "30 min / day"
  ├─ totalDays:   30
  ├─ summary:     "A progressive 30-day volume plan..."
  ├─ phases:      [ { title, days, focus }, ... ]
  ├─ completed:   [0, 1, 2, 5, ...]        ← array of day indices
  ├─ logs: {
  │    "0": { did: "4x12...", notes: [{ text: "...", tag: "Do" }] },
  │    "5": { did: "5x15...", notes: [...] }
  │  }
  └─ createdAt:   Timestamp
```

---

## 🔒 Security

- Firestore rules enforce that each user can only read and write their own data (`request.auth.uid == uid`)
- The Gemini API key is stored as a Firebase Functions secret and is **never exposed to the client**
- Firebase Anonymous Auth assigns a unique `uid` to each visitor automatically

---

## 🛠️ Local Development

```bash
npm run dev        # start Vite dev server at localhost:5173
firebase emulators:start   # optional: run Firestore + Functions locally
```

---

## 📄 License

MIT — use it, fork it, ship it.

---

<div align="center">
Built with Claude · Deployed on Firebase · Powered by Gemini
</div>
