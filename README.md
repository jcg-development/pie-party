# Pie Party (Next.js + Firebase)

A simple, good‑looking site for your pie competition. Features:

- Submit pies with photo + description (Firebase Storage/Firestore)
- Voting across categories (**Best Overall**, **Best Crust**, **Most Creative**)
- Live tallies on Home
- Admin console: open/close voting, mark winners, export CSVs, QR link
- Winners gallery
- RSVP page (name/email/guests/notes)
- Anonymous auth (no account management)

## 1) Firebase Setup (what it is + steps)

**What is Firebase?**  
Firebase is a Google platform that gives you ready‑to‑use backend services for web apps: a database (Firestore), file storage (Storage), and authentication (Auth). We use it so you can deploy this as a static site—no servers to manage.

**Steps:**  
1. Go to [Firebase Console](https://console.firebase.google.com/) → Create a Project.
2. Add a **Web app** to your project. Copy the config values.
3. Enable **Authentication** → Sign‑in method → turn on **Anonymous**.
4. Enable **Firestore** (production mode is fine for small events).
5. Enable **Storage**.

Paste your web config into `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=... 
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

NEXT_PUBLIC_ADMIN_PASSPHRASE=choose-a-secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Firestore Security Rules (starter)

These are simple demo rules—good enough for a private party. We can harden them if needed.

**Firestore rules:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
    }
    match /votes/{uid} {
      allow write: if request.auth != null && request.auth.uid == uid;
    }
    match /pies/{docId} {
      allow write: if request.auth != null;
    }
    match /winners/{docId} {
      allow write: if request.auth != null;
    }
    match /settings/{docId} {
      allow write: if request.auth != null;
    }
    match /rsvps/{docId} {
      allow write: if request.auth != null;
    }
  }
}
```

**Storage rules:**
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 2) Develop & Run (VS Code)

```bash
# in VS Code terminal
npm install
cp .env.local.example .env.local   # add your Firebase values
npm run dev
# open http://localhost:3000
```

## 3) Deploy (Vercel)

1. Push this folder to GitHub.
2. In Vercel, “New Project” → import the repo → set **Environment Variables** from your `.env.local`.
3. Deploy. Update `NEXT_PUBLIC_SITE_URL` to your live URL and redeploy once.

## Notes

- Categories live in `src/lib/config.ts`. Add/remove to customize.
- Voting results aggregate the `votes` collection client‑side (great for small events).
- Admin page has QR code for quick guest access to `/vote`.
- CSV export is client-side (no server required).

Have fun, and may the flakiest crust win!
