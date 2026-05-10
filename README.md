# Fordham SwipeShare

A campus platform for Fordham University students to share meal swipes, post listings, message each other, and engage in a community forum. Available as both a **web app** and a **mobile app** (iOS / Android via Expo Go).

---

## Live Demo

**Web app (no setup required):** https://www.dsm.fordham.edu/~ty10/web-preview-vite/

To use the web demo:
1. Click **Register**, fill in the form, hit "Create Account"
2. Refresh the page, then log in with your credentials
3. (Email verification is auto-bypassed in the demo since the free tier doesn't include an email service)

---

## Running the Mobile App (for graders / reviewers)

The mobile app runs through **Expo Go**, a free app on the App Store / Play Store that loads React Native projects without needing TestFlight or Play Store distribution.

### Prerequisites (one-time setup)

- **Node.js 18 or newer** — https://nodejs.org/
- **Git** — https://git-scm.com/
- **Expo Go** on your phone — free, from the App Store / Play Store

### Steps

```bash
# 1. Clone this repo
git clone https://github.com/TianyiY519/SwipeShare.git
cd SwipeShare/mobile-app

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Start the development server
npx expo start --tunnel
```

A QR code will appear in the terminal.

- **iPhone**: open the **Camera** app and point it at the QR code — Expo Go opens automatically
- **Android**: open Expo Go and use its built-in "Scan QR code" button

The `--tunnel` flag means your phone and computer don't need to be on the same Wi-Fi.

**Login:** the same account you registered for the web demo works on mobile too — both share the same backend.

**To stop:** press `Ctrl + C` in the terminal.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Web frontend | React + TypeScript, built with Vite |
| Mobile frontend | React Native with Expo SDK 54 |
| Backend | Django 5 + Django REST Framework, JWT authentication |
| Database | PostgreSQL (Supabase) |
| Web hosting | Fordham `storm.cis.fordham.edu` |
| Backend hosting | Railway |

---

## Features

### Account & Profile
- Register / log in with a Fordham email
- Profile shows campus, activity stats, and reliability score
- Editable profile information

### Swipe Sharing
- Post a Donation (have a swipe) or Request (need a swipe)
- Each listing includes type, campus, quantity, date, optional time and meeting location
- Filter by type (Donations / Requests) and campus (Rose Hill / Lincoln Center)
- **Editable quantity**: when you reduce a listing's quantity (e.g. 5 → 4), the difference is automatically added to your "Completed Shares" count
- Delete listing with confirmation, which also counts toward completed shares

### Matching
- Requesters can match their request to a donor's listing in one tap
- Donors see all incoming conversations from interested students

### Messaging
- Click any username (in forum, comments, swipe listings) to open a private chat
- All messages between two users go into a single thread, regardless of which post or listing started the conversation
- Quote-and-reply support (similar to WhatsApp / iMessage)
- Smart-scroll: scrolling up to read older messages does not auto-jump you to the bottom; instead a floating "↓ N new messages" pill appears
- **Unread badges** on the Messages tab (web and mobile), updating every few seconds without page refresh
- Delete entire conversations

### Forum
- Five categories: Housing & Sublets, Marketplace, Ride Sharing, Events, General
- Sort posts by Hot / Best / New / Rising
- Search by keyword or hashtag
- Like, comment, nested replies
- Click a poster's or commenter's name to message them directly

### Home Page
- "What's New" feed with real-time notifications: new messages, new comments on your posts, likes
- Tap any notification to jump straight to the source (chat, post, or specific comment)
- Activity Overview: Donated / Received / Completed counters that update automatically as you interact with listings

### Admin Panel (staff only)
- View all reports filtered by status (Pending / Under Review / Resolved / Dismissed)
- Click a report to **jump directly to the reported content** — for a comment report, the app scrolls to the specific comment and highlights it
- Manage users (view, search, suspend, ban)
- Take moderation actions tied to reports

---

## Project Structure

```
FordhamSwipeShare/
├── backend/                   # Django REST API
│   ├── apps/
│   │   ├── users/             # Auth, JWT, profile
│   │   ├── swipes/            # Swipe listings & matching
│   │   ├── forum/             # Posts, comments, likes
│   │   ├── messaging/         # Conversations & messages
│   │   └── moderation/        # Reports & admin actions
│   ├── config/                # Django settings & URLs
│   └── manage.py
│
├── mobile-app/                # React Native (Expo SDK 54)
│   ├── src/
│   │   ├── screens/           # All app screens
│   │   ├── AuthContext.tsx    # Auth state & token handling
│   │   ├── api.ts             # Axios client (JWT-aware)
│   │   └── startChat.ts       # Helper to open/start a chat
│   ├── App.tsx                # Tab navigator
│   └── app.json
│
└── web-preview-vite/          # React + Vite web app
    ├── src/
    │   ├── App.tsx            # Single-file app (with all screens)
    │   └── App.css
    └── postbuild.cjs          # Generates per-route HTML files
```

---

## Limitations (free-tier hosting)

- **No image uploads** — would require paid cloud storage (e.g. AWS S3)
- **No email verification** — would require a paid email service (e.g. SendGrid); accounts are auto-verified for the demo
- **Possible cold starts** — Railway's free tier may take a few seconds to wake up after idle time

---

## License

MIT License — Educational Capstone Project

Not affiliated with or endorsed by Fordham University.
