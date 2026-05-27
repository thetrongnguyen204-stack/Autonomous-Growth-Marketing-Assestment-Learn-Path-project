# Learn Path — Deployment Guide

Follow these steps exactly. Total time: ~15 minutes.

---

## Step 0: Revoke your leaked API key

You pasted a Gemini API key in chat — treat it as compromised.

1. Go to https://aistudio.google.com/app/apikey
2. Delete the exposed key
3. Generate a **new** key (you'll use it in Step 4)

---

## Step 1: Create a Firebase project

1. Go to https://console.firebase.google.com
2. Click **Add project** → name it `learn-path` → continue
3. Disable Google Analytics (optional, simplifies setup) → **Create project**
4. In the sidebar, click **Build → Firestore Database** → **Create database** → pick a location (e.g. `asia-southeast1` for Vietnam) → **Start in production mode**
5. In the sidebar, click **Build → Authentication** → **Get started** → enable **Anonymous** sign-in method
6. Click the **gear icon** (Project settings) → scroll down → **Add app** → choose **Web** → name it `learn-path-web` → **Register app**
7. Copy the `firebaseConfig` object — you'll need it in Step 3

---

## Step 2: Install tools and dependencies

Open your terminal:

```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Navigate to the project folder
cd learn-path

# Install frontend dependencies
npm install

# Install Cloud Functions dependencies
cd functions
npm install
cd ..

# Link to your Firebase project
firebase use --add
# Select your project from the list, alias it as "default"
```

---

## Step 3: Set your Firebase config

Copy `.env.example` to `.env` and fill in the values from Step 1:

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_FB_API_KEY=AIzaSy...your-firebase-web-api-key
VITE_FB_AUTH_DOMAIN=learn-path-xxxxx.firebaseapp.com
VITE_FB_PROJECT_ID=learn-path-xxxxx
VITE_FB_STORAGE_BUCKET=learn-path-xxxxx.firebasestorage.app
VITE_FB_MESSAGING_SENDER_ID=123456789012
VITE_FB_APP_ID=1:123456789012:web:abcdef123456
```

> **Note:** The Firebase web API key is safe in frontend code — it only
> identifies the project. Access is controlled by Firestore Security Rules.

---

## Step 4: Set the Gemini API key as a secret

This is the critical step that keeps your AI key **server-side only**.

```bash
firebase functions:secrets:set GEMINI_KEY
```

When prompted, paste your **new** Gemini API key (the one you generated
after revoking the old one). Press Enter.

This stores the key encrypted in Google Cloud Secret Manager. It's only
accessible inside the Cloud Function — never in the browser.

---

## Step 5: Deploy everything

```bash
# Build the frontend
npm run build

# Deploy Firestore rules, Cloud Functions, and Hosting in one command
firebase deploy
```

This deploys:
- **Firestore rules** → only authenticated users can read/write their own data
- **Cloud Function** (`generateRoadmap`) → calls Gemini with your secret key
- **Hosting** → serves the built React app

Firebase will print your live URL:

```
✔ Hosting URL: https://learn-path-xxxxx.web.app
```

Open it. You're live.

---

## Step 6: Test it

1. Open your Hosting URL in a browser
2. You should see the dashboard (empty — no projects yet)
3. Click **+ Add project** → fill in name, goal, commitment → **Generate roadmap**
4. The AI should create a phased roadmap in a few seconds
5. Click day boxes, check in, add logs and learn notes
6. Refresh the page — your data persists (it's in Firestore)

---

## Troubleshooting

**"Permission denied" on Firestore**
→ Make sure you enabled Anonymous authentication (Step 1.5).

**Cloud Function fails / times out**
→ Check the function logs: `firebase functions:log`
→ Make sure the GEMINI_KEY secret is set: `firebase functions:secrets:access GEMINI_KEY`

**Roadmap falls back to local generator**
→ The app has a built-in fallback. If Gemini fails, it generates
  a sensible roadmap locally. Check function logs for the root cause.

**"No Firebase app" error in console**
→ Double-check your `.env` values match the Firebase console exactly.

---

## Project structure

```
learn-path/
├── index.html              ← HTML entry
├── vite.config.js          ← Vite bundler config
├── package.json            ← Frontend dependencies
├── firebase.json           ← Firebase hosting + functions config
├── firestore.rules         ← Security rules
├── .env                    ← Your Firebase config (git-ignored)
├── src/
│   ├── main.jsx            ← React entry
│   ├── App.jsx             ← Main app component (all views)
│   ├── firebase.js         ← Firebase client init + auth
│   ├── styles.css          ← Full stylesheet
│   └── utils/
│       ├── firestore.js    ← Firestore CRUD operations
│       ├── roadmap.js      ← AI roadmap (calls Cloud Function)
│       └── helpers.js      ← Utility functions
├── functions/
│   ├── package.json        ← Cloud Function dependencies
│   └── index.js            ← generateRoadmap Cloud Function (Gemini)
└── public/
    └── favicon.svg
```

---

## Data model (Firestore)

```
users/{uid}/projects/{projectId}
  ├─ name:        "Push up mastery"
  ├─ goal:        "100 consecutive push-ups"
  ├─ commitment:  "30 min / day"
  ├─ totalDays:   30
  ├─ summary:     "A progressive 30-day volume plan..."
  ├─ phases:      [ { title, days, focus }, ... ]
  ├─ completed:   [0, 1, 2, 3, 4, 5]   ← day indices
  ├─ logs:        {
  │     "0": { did: "4x12...", notes: [{ text: "...", tag: "Do" }] },
  │     "5": { did: "5x15...", notes: [...] }
  │   }
  └─ createdAt:   <server timestamp>
```

---

## What to do next

- **Custom domain**: Firebase Console → Hosting → Add custom domain
- **Google sign-in**: Replace anonymous auth with Google provider for cross-device sync
- **Export notes**: Add a button to export all learn notes as markdown
- **Dark mode**: Add CSS variable overrides for a dark theme

---

Done. Your app is live. Ship it and start learning.
