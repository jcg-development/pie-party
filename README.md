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

### Firestore Security Rules

**IMPORTANT**: You must deploy the `firestore.rules` file to Firebase for the app to work properly, especially the testing features.

#### Deploy Rules to Firebase

**Option 1: Firebase Console (Quick)**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** → **Rules** tab
4. Copy the contents of `firestore.rules` and paste it
5. Click **Publish**

**Option 2: Firebase CLI (Recommended for development)**
```bash
# Install Firebase CLI if you haven't
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not done)
firebase init firestore
# Select your project, use default file names

# Deploy rules
firebase deploy --only firestore:rules
```

The rules file (`firestore.rules`) includes:
- Admin-based permissions for testing features
- Secure vote handling (users can only vote as themselves)
- Public read access for all data
- Admin-only deletion and winner management

**Note**: The testing features require admin permissions to create mock votes with specific UIDs.

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

## 4) Testing Features

This app includes comprehensive testing tools for submissions and judging. See `TESTING.md` for full details.

**Quick Start:**
1. Deploy Firestore rules (see above - required!)
2. Go to `/admin` and unlock with your passphrase
3. Click "➕ Add Mock Data" to create 6 sample pies + 5 votes
4. Visit `/submit` and `/vote` to see the data
5. Click "📊 Show Results" in admin to see winners
6. Click "🗑️ Clear All Data" when done testing

**What's Included:**
- Mock pie submissions (3 sweet, 3 savory)
- Mock voting data (5 voters with realistic patterns)
- Results viewer showing winners by category
- One-click data clearing

## Notes

- Categories live in `src/lib/config.ts`. Add/remove to customize.
- Voting results aggregate the `votes` collection client‑side (great for small events).
- Admin page has QR code for quick guest access to `/vote`.
- CSV export is client-side (no server required).
- Testing utilities in `src/lib/testData.ts` for mock data generation.

Have fun, and may the flakiest crust win!
