# Testing Guide for Pie Party Submission & Judging

## Overview

Your Pie Party website now has comprehensive testing capabilities to verify the submission and judging workflow without needing real participants. This guide explains how to test the complete flow from pie submissions through voting to viewing results.

## Testing Features

### 1. Mock Data Generation
- **6 Mock Pies**: 3 sweet (Apple, Chocolate, Lemon) and 3 savory (Chicken, Spinach & Feta, Beef Wellington)
- **5 Mock Voters**: Realistic voting patterns across all 6 categories (3 sweet, 3 savory)
- **Sample Photos**: Uses Unsplash placeholder images for realistic visual testing

### 2. Results Viewer
- View live voting tallies by category
- See winners for each category (PieZaz, Taste, Presentation) × (Sweet, Savory)
- Summary statistics for total pies and votes

### 3. Data Management
- Clear all test data with one click
- Delete individual pies, votes, or winners as needed
- Export data to CSV for analysis

## How to Test the Submission & Judging Flow

### Step 1: Access the Admin Panel

1. Navigate to `/admin` in your browser
2. Enter the admin passphrase (set in `.env.local` as `NEXT_PUBLIC_ADMIN_PASSPHRASE`)
3. Click "Unlock" to access admin controls

### Step 2: Configure Settings

Before testing, ensure the right settings are enabled:

- **Open Submissions**: Click "Open Submissions" button
  - This allows the submit page to accept new pies
  - Navigate to `/submit` to verify the form is visible
  
- **Open Voting**: Click "Open Voting" button
  - This allows the vote page to accept votes
  - Navigate to `/vote` to verify voting buttons work

### Step 3: Add Mock Data

1. In the "🧪 Testing & Mock Data" section, click **"➕ Add Mock Data"**
2. Confirm the dialog
3. Wait for success message (adds 6 pies + 5 votes)
4. Click **"Refresh Data"** to update the admin view

### Step 4: Test the Submission Page

Navigate to `/submit` and verify:

- ✅ All 6 mock pies are visible in the "Current Entries" section
- ✅ Pies are correctly tagged as Sweet 🍰 or Savory 🥟
- ✅ Photos are displayed properly
- ✅ Filter and search functionality works
- ✅ Sort options work correctly

You can also manually submit additional pies using the form at the bottom to test real submissions.

### Step 5: Test the Voting Page

Navigate to `/vote` and verify:

- ✅ Pies are organized into Sweet and Savory sections
- ✅ Each section shows 3 categories: PieZaz, Taste, Presentation
- ✅ Vote counts are displayed for each pie
- ✅ You can cast votes by clicking the "Vote" button
- ✅ Your votes are highlighted with a green ring
- ✅ You can change your vote by clicking a different pie
- ✅ Vote tallies update after you vote

### Step 6: View Results

Back in the Admin Panel:

1. Click **"📊 Show Results"** button
2. Review the results panel showing:
   - Winners for each category (Sweet/Savory × PieZaz/Taste/Presentation)
   - Number of votes each winner received
   - Summary statistics

Expected results with mock data:
- **Sweet Winner**: Classic Apple Pie with ~11-13 total votes
  - Breakdown shows votes across PieZaz, Taste, and Presentation
- **Savory Winner**: Chicken Pot Pie or Spinach & Feta Greek Pie with ~8-11 total votes
  - Breakdown shows votes across PieZaz, Taste, and Presentation
- Results display shows the combined totals and category breakdown

### Step 7: Test Winner Selection

1. In the "Mark Winner" section:
   - Select a year (e.g., 2025)
   - Choose a pie from the dropdown
   - Click "Save Winner"
2. Navigate to `/winners` page
3. Verify the winner appears in the gallery

### Step 8: Clear Test Data

When done testing:

1. Click **"🗑️ Clear All Data"** button
2. Confirm both dialogs (this is a destructive action)
3. Verify all pies, votes, and winners are removed
4. The counts should show: "0 pies, 0 votes, 0 winners"

## Testing Scenarios

### Scenario 1: Basic Flow
```
1. Add mock data
2. View submissions page → verify 6 pies
3. View voting page → cast some votes
4. View results → see tallies
5. Clear data
```

### Scenario 2: Manual Submissions
```
1. Open submissions
2. Go to /submit
3. Fill out form with test pie
4. Submit and verify it appears
5. Admin: Delete the test pie
```

### Scenario 3: Vote Changes
```
1. Add mock data
2. Go to /vote
3. Vote for one pie in a category
4. Change your vote to a different pie
5. Admin: Verify tallies updated correctly
```

### Scenario 4: Results Export
```
1. Add mock data
2. Admin: Export Pies CSV
3. Admin: Export Votes CSV
4. Open CSVs in Excel/Google Sheets
5. Verify data structure
```

## Voting & Scoring System

### Voting Categories

The system uses 6 voting categories:

**Sweet Pies (3 categories)**
- **PieZaz-sweet**: Wow factor for sweet pies
- **Taste-sweet**: Flavor and texture for sweet pies
- **Presentation-sweet**: Visual appeal for sweet pies

**Savory Pies (3 categories)**
- **PieZaz-savory**: Wow factor for savory pies
- **Taste-savory**: Flavor and texture for savory pies
- **Presentation-savory**: Visual appeal for savory pies

Each voter can cast **6 total votes** (one per category).

### Scoring System - Combined Totals

**How Winners Are Determined:**
- There are **2 overall winners**: one for Sweet and one for Savory
- Each pie's score is the **sum of all votes** across the three categories
- Example: If a pie receives 4 PieZaz votes, 5 Taste votes, and 2 Presentation votes, their **total score is 11 votes**
- The pie with the highest combined total in each type (sweet/savory) wins

**With Mock Data:**
- Classic Apple Pie typically wins Sweet (gets most combined votes across all 3 categories)
- Chicken Pot Pie typically wins Savory (gets most combined votes across all 3 categories)
- You'll see the vote breakdown showing how votes were distributed across categories

## Database Structure

### Collections
- **`pies`**: Pie submissions with photos and metadata
- **`votes`**: One document per voter (uid), contains all their category votes
- **`winners`**: Past winners for the gallery
- **`rsvps`**: Party RSVPs (not affected by test data)
- **`settings`**: Global settings (votingOpen, submissionsOpen)
- **`admins`**: Admin user IDs

## Troubleshooting

### Mock data won't add
- **Check Firebase rules**: Ensure anonymous users can write to `pies` collection
- **Check submissions setting**: Must be open to add pies
- **Check console**: Look for error messages in browser dev tools

### Votes don't update
- **Check voting setting**: Must be open to cast votes
- **Check authentication**: User must be signed in (anonymous auth)
- **Refresh the page**: Click "Refresh Data" in admin panel

### Results don't show
- **Need votes**: Must have at least one vote cast
- **Click show results**: Button only appears after votes exist
- **Check vote structure**: Votes should use format "Category-type" (e.g., "PieZaz-sweet")

### Can't delete data
- **Check admin status**: Must be enrolled as admin
- **Check Firebase rules**: Admin users must have delete permissions
- **Try individual deletes**: Use the delete buttons in Manage Pies section

## File Structure

### New Testing Files
- **`src/lib/testData.ts`**: Mock data utilities and clearing functions
  - `addMockPies()`: Creates 6 sample pies
  - `addMockVotes()`: Creates 5 sample voters
  - `clearAllTestData()`: Removes all pies, votes, and winners
  - `calculateTallies()`: Computes vote counts
  - `getWinnersByCategory()`: Determines winners

### Modified Files
- **`src/app/admin/page.tsx`**: Added testing panel with controls
  - Mock data buttons
  - Results viewer
  - Clear data functionality

### Existing Core Files
- **`src/lib/db.ts`**: Database operations
- **`src/app/submit/page.tsx`**: Pie submission form
- **`src/app/vote/page.tsx`**: Voting interface
- **`src/app/winners/page.tsx`**: Winners gallery

## Best Practices

1. **Always test in order**: Submissions → Voting → Results → Clear
2. **Use mock data first**: Test with mock data before real submissions
3. **Clear between tests**: Start fresh for each complete test cycle
4. **Check all pages**: Verify changes appear across Submit, Vote, and Admin pages
5. **Test on mobile**: Ensure voting interface works on phone screens
6. **Export data**: Keep CSV backups before clearing data

## Next Steps

After testing is successful:

1. **Close submissions**: Until party night
2. **Close voting**: Until judging time
3. **Set passphrase**: Use a secure admin passphrase
4. **Configure Firebase**: Ensure production rules are secure
5. **Test on devices**: Try on different browsers and devices

## Support

If you encounter issues:

1. Check browser console for errors
2. Verify Firebase configuration
3. Check `.env.local` for correct environment variables
4. Review Firestore rules for permission issues
5. Test with Firebase emulators for local development

---

**Happy Testing! 🥧**
