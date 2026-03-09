# Golf Scramble — Setup Guide

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React 19 + TypeScript + Vite | Fast dev, great mobile DX |
| Styling | Tailwind CSS v3 | Mobile-first utility classes |
| Real-time DB | Firebase Firestore | Free tier, real-time listeners, no backend needed |
| Routing | React Router v6 | Standard, works with SPA |

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Firebase Project Setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project (e.g. `golf-scramble`)
3. Enable **Firestore Database** (start in test mode for development)
4. Go to **Project Settings → General → Your apps** → Add Web app
5. Copy the config values

### 3. Environment Variables

Copy `.env.example` to `.env.local` and fill in your Firebase config:

```bash
cp .env.example .env.local
```

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 4. Firestore Security Rules

Deploy the rules from `firestore.rules`:

```bash
# Install Firebase CLI if needed
npm install -g firebase-tools
firebase login
firebase init firestore  # select your project
firebase deploy --only firestore:rules
```

Or paste the contents of `firestore.rules` directly in the Firebase Console under
**Firestore → Rules**.

### 5. Run Dev Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 6. Build for Production

```bash
npm run build
npm run preview  # local preview of production build
```

## Deployment

### Firebase Hosting (recommended)

```bash
firebase init hosting
# Public directory: dist
# SPA: yes (rewrite all to index.html)
npm run build
firebase deploy
```

### Vercel / Netlify

1. Push to GitHub
2. Connect repo in Vercel/Netlify
3. Set env variables in dashboard
4. Build command: `npm run build`, output: `dist`
5. Add SPA rewrite rule: `/* → /index.html`

## Architecture

```
src/
├── types/index.ts          # All TypeScript interfaces
├── lib/
│   ├── firebase.ts         # Firestore client + exports
│   └── utils.ts            # Pure helpers (leaderboard, IDs, colors)
├── hooks/
│   ├── useRound.ts         # Firestore subscriptions + CRUD
│   └── useLocalStorage.ts  # Typed localStorage hook
├── components/
│   ├── ui/                 # Button, Input (reusable)
│   └── layout/PageLayout   # Sticky header + page wrapper
└── pages/
    ├── Home.tsx            # Landing — create or join
    ├── CreateRound.tsx     # 3-step wizard (info → teams → pars)
    ├── JoinRound.tsx       # Enter code, pick team
    ├── Lobby.tsx           # Waiting room with join code share
    ├── Round.tsx           # Score entry + live leaderboard tabs
    ├── Summary.tsx         # Final standings + hole-by-hole
    └── History.tsx         # All past rounds
```

## Data Model

Each round is a single Firestore document under `rounds/{roundId}`:

```
Round {
  id, name, courseName, joinCode
  status: 'setup' | 'lobby' | 'active' | 'completed'
  createdAt: number (unix ms)
  teams: Team[3]          // fixed 3 teams
  holes: Hole[18]         // 18-hole scoring array
  scorers: { teamId: deviceId }  // which phone scores each team
}

Team { id, name, color, players: string[4] }

Hole {
  number: 1-18
  par: 3|4|5
  scores: {
    team0: { score: number|null, shotguns: 0|1|2 }
    team1: { ... }
    team2: { ... }
  }
}
```

## How Multi-Device Sync Works

- Each browser gets a stable `deviceId` from `localStorage`
- When joining, `deviceId` is written to `round.scorers[teamId]`
- All pages subscribe to the round via `onSnapshot()` — updates arrive in <500ms
- Score saves use field-path updates: `holes.${i}.scores.${teamId}.score`
  so concurrent edits from different devices don't overwrite each other

## Future Features

- Handicap support (store handicap per player, adjust to-par display)
- Skins contest (mark winner per hole, tally skins)
- Closest-to-the-pin tracking (per par-3 hole)
- Photo sharing per hole
- Season leaderboard (aggregate across multiple rounds)
- Tournament bracket (multiple scramble groups)
- PWA offline support with service worker + background sync
- QR code for join link (replace manual code entry)
