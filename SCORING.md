# Scoring System Documentation

## Overview

The Pie Party uses a **combined scoring system** where winners are determined by adding up votes across all three voting categories. There are **2 winners total**: one for Sweet pies and one for Savory pies.

## How It Works

### Voting Categories
- **PieZaz**: The wow factor - memorable, iconic, special
- **Taste**: Balanced flavor and texture
- **Presentation**: Visual appeal and design

### Scoring Method
Each pie's total score is calculated by combining votes from all three categories:

```
Total Score = PieZaz Votes + Taste Votes + Presentation Votes
```

**Example:**
- Pie gets 4 PieZaz votes
- Pie gets 5 Taste votes  
- Pie gets 2 Presentation votes
- **Total Score: 11 votes**

The pie with the highest total in each type (sweet/savory) wins!

## Implementation

### Core Scoring Module: `src/lib/scoring.ts`

This is the **MAIN** scoring module used throughout the application. All scoring calculations should import from here.

#### Main Functions

**1. `getOverallWinners(pies, votes)`**
- **Purpose**: Determines the winners on party day
- **Returns**: One winner for sweet, one for savory with totals and breakdowns
- **Used by**: Admin panel, live results displays
- **Usage**:
```typescript
import { getOverallWinners } from '@/lib/scoring'

const winners = getOverallWinners(pies, votes)
// winners.sweet = { pie, totalVotes, breakdown }
// winners.savory = { pie, totalVotes, breakdown }
```

**2. `getAllPieScores(pies, votes)`**
- **Purpose**: Get leaderboard with all pies sorted by score
- **Returns**: Sorted arrays of sweet and savory pies with scores
- **Used by**: Live leaderboards, detailed results pages
- **Usage**:
```typescript
import { getAllPieScores } from '@/lib/scoring'

const scores = getAllPieScores(pies, votes)
// scores.sweet = [{ pie, totalVotes, breakdown }, ...]
// scores.savory = [{ pie, totalVotes, breakdown }, ...]
```

**3. `calculateTallies(votes)`**
- **Purpose**: Calculate raw vote counts per category
- **Returns**: Vote counts by category and pie ID
- **Used by**: Internal calculations, debugging
- **Usage**:
```typescript
import { calculateTallies } from '@/lib/scoring'

const tallies = calculateTallies(votes)
// tallies['PieZaz-sweet'][pieId] = count
```

## Where Scoring Is Used

### 1. Admin Panel (`src/app/admin/page.tsx`)
**Live on Party Day** ✅

```typescript
import { getOverallWinners, calculateTallies } from '@/lib/scoring'

// Show live results
const { overallWinners } = calculateResults()
// Displays sweet and savory winners with vote breakdowns
```

**Features:**
- Real-time winner display
- Vote breakdowns by category
- Total vote counts
- Refresh button to update results

### 2. Testing Module (`src/lib/testData.ts`)
**Re-exports for consistency** ✅

```typescript
export { calculateTallies, getOverallWinners } from './scoring'
```

All test data uses the same scoring logic as production.

### 3. Home Page (`src/app/page.tsx`)
**Explains scoring to users** ✅

Displays information about:
- How winners are chosen (combined totals)
- Example calculations
- Sweet vs Savory winners

## Live Scoring Workflow

### On Party Day

1. **Guests Vote** (`/vote` page)
   - Each guest casts 6 votes (3 sweet, 3 savory categories)
   - Votes are saved to Firebase Firestore

2. **Admin Monitors** (`/admin` page)
   - Click "Refresh Data" to load latest votes
   - Click "📊 Show Results" to see current winners
   - View live breakdowns:
     - Total votes per pie
     - Category-by-category breakdown
     - Current leaders

3. **Winners Determined**
   ```typescript
   const winners = getOverallWinners(pies, votes)
   
   // Sweet Winner
   console.log(winners.sweet.pie.name)
   console.log(winners.sweet.totalVotes)
   console.log(winners.sweet.breakdown) 
   // { PieZaz: 4, Taste: 5, Presentation: 2 }
   
   // Savory Winner
   console.log(winners.savory.pie.name)
   console.log(winners.savory.totalVotes)
   console.log(winners.savory.breakdown)
   ```

4. **Announce Winners**
   - Sweet pie with highest combined total
   - Savory pie with highest combined total

5. **Mark Winners** (Optional)
   - Use "Mark Winner" section in admin
   - Saves to winners gallery for public viewing

## Adding Custom Displays

If you want to add live scoring to other pages:

```typescript
'use client'
import { useEffect, useState } from 'react'
import { listPies, getAllVotes } from '@/lib/db'
import { getOverallWinners } from '@/lib/scoring'

export default function LiveResults() {
  const [winners, setWinners] = useState<any>(null)
  
  useEffect(() => {
    async function loadResults() {
      const pies = await listPies()
      const votes = await getAllVotes()
      const results = getOverallWinners(pies, votes)
      setWinners(results)
    }
    loadResults()
    // Refresh every 30 seconds
    const interval = setInterval(loadResults, 30000)
    return () => clearInterval(interval)
  }, [])
  
  if (!winners) return <div>Loading...</div>
  
  return (
    <div>
      <h2>Sweet Winner: {winners.sweet?.pie.name}</h2>
      <p>Total: {winners.sweet?.totalVotes} votes</p>
      
      <h2>Savory Winner: {winners.savory?.pie.name}</h2>
      <p>Total: {winners.savory?.totalVotes} votes</p>
    </div>
  )
}
```

## Data Structure

### Vote Document (Firestore)
```json
{
  "id": "user-uid",
  "PieZaz-sweet": "pie-id-1",
  "Taste-sweet": "pie-id-1", 
  "Presentation-sweet": "pie-id-2",
  "PieZaz-savory": "pie-id-4",
  "Taste-savory": "pie-id-5",
  "Presentation-savory": "pie-id-4",
  "updatedAt": "timestamp"
}
```

### Winner Result Structure
```typescript
{
  sweet: {
    pie: {
      id: string
      name: string
      baker: string
      type: 'sweet'
      // ... other pie fields
    },
    totalVotes: number,  // e.g., 11
    breakdown: {
      PieZaz: number,      // e.g., 4
      Taste: number,       // e.g., 5
      Presentation: number // e.g., 2
    }
  },
  savory: {
    // same structure as sweet
  }
}
```

## Testing

Test the scoring system:

1. Go to `/admin`
2. Click "➕ Add Mock Data"
3. Click "📊 Show Results"
4. Verify:
   - Totals are sums of all categories
   - Breakdowns show individual category votes
   - Winners have highest combined totals

## Troubleshooting

### Results don't update
- Click "Refresh Data" in admin panel
- Check that votes are being saved (check Firestore console)
- Verify Firebase rules allow reading votes

### Wrong winner showing
- Verify `getOverallWinners` is being imported from `@/lib/scoring`
- Check that all categories are included in totals
- Use browser console to debug: `console.log(getOverallWinners(pies, votes))`

### Ties
If two pies have the same total:
- First pie in the iteration wins (implementation detail)
- Can add tie-breaking logic if needed (e.g., by timestamp, or random)

## Best Practices

1. **Always use `src/lib/scoring.ts`** - Don't reimplement scoring logic elsewhere
2. **Refresh frequently** - Admin should refresh before announcing winners
3. **Test before party** - Use mock data to verify scoring works
4. **Export results** - Use CSV export to keep records
5. **Close voting** - Toggle "Close Voting" before announcing winners

## Files Reference

### Core Scoring
- `src/lib/scoring.ts` - **Main scoring functions**

### Using Scoring
- `src/app/admin/page.tsx` - Admin panel with live results
- `src/lib/testData.ts` - Re-exports for testing

### Information
- `src/app/page.tsx` - Explains scoring to users
- `TESTING.md` - How to test scoring
- `SCORING.md` - This file

---

**On party day, use the admin panel at `/admin` to see live results and determine winners!** 🏆
