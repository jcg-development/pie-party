// src/lib/testData.ts
/**
 * Test data utilities for mock submissions and judging
 */
import { collection, addDoc, serverTimestamp, getDocs, deleteDoc, writeBatch, doc, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { submitPie, saveVote, piesCol, votesCol, winnersCol } from './db'
import { CATEGORIES } from './config'
import { calculateTallies, getOverallWinners } from './scoring'

export const MOCK_PIES = [
  {
    name: 'Classic Apple Pie',
    baker: 'Alice Anderson',
    description: 'Traditional apple pie with cinnamon and a flaky butter crust',
    type: 'sweet' as const,
    photoURL: 'https://images.unsplash.com/photo-1535920527002-b35e96722eb9?w=400',
    photoPath: 'mock/apple-pie.jpg'
  },
  {
    name: 'Chocolate Silk Delight',
    baker: 'Bob Baker',
    description: 'Rich chocolate filling with whipped cream topping',
    type: 'sweet' as const,
    photoURL: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400',
    photoPath: 'mock/chocolate-pie.jpg'
  },
  {
    name: 'Lemon Meringue Dream',
    baker: 'Carol Chen',
    description: 'Tangy lemon custard with fluffy meringue peaks',
    type: 'sweet' as const,
    photoURL: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=400',
    photoPath: 'mock/lemon-pie.jpg'
  },
  {
    name: 'Savory Chicken Pot Pie',
    baker: 'David Davis',
    description: 'Creamy chicken and vegetable filling in a golden crust',
    type: 'savory' as const,
    photoURL: 'https://images.unsplash.com/photo-1590212151175-e58edd96185b?w=400',
    photoPath: 'mock/chicken-pie.jpg'
  },
  {
    name: 'Spinach & Feta Greek Pie',
    baker: 'Elena Evans',
    description: 'Spanakopita-style with layers of phyllo dough',
    type: 'savory' as const,
    photoURL: 'https://images.unsplash.com/photo-1598511726623-d2e9996892f0?w=400',
    photoPath: 'mock/spinach-pie.jpg'
  },
  {
    name: 'Beef & Mushroom Wellington',
    baker: 'Frank Foster',
    description: 'Tender beef with mushroom duxelles wrapped in puff pastry',
    type: 'savory' as const,
    photoURL: 'https://images.unsplash.com/photo-1619643380635-f33c31e66014?w=400',
    photoPath: 'mock/beef-pie.jpg'
  }
]

/**
 * Add mock pies for testing
 */
export async function addMockPies(): Promise<string[]> {
  const pieIds: string[] = []
  
  for (const pie of MOCK_PIES) {
    const docRef = await addDoc(piesCol(), {
      ...pie,
      createdAt: serverTimestamp()
    })
    pieIds.push(docRef.id)
  }
  
  return pieIds
}

/**
 * Add mock votes for testing
 * Creates 5 mock voters with realistic voting patterns
 */
export async function addMockVotes(pieIds: string[]): Promise<void> {
  // Separate pies by type
  const sweetPies = pieIds.slice(0, 3) // First 3 are sweet
  const savoryPies = pieIds.slice(3, 6) // Last 3 are savory
  
  // Create 5 mock voters with different voting patterns
  const mockVoters = [
    {
      uid: 'test-voter-1',
      votes: {
        'PieZaz-sweet': sweetPies[0],
        'Taste-sweet': sweetPies[0],
        'Presentation-sweet': sweetPies[1],
        'PieZaz-savory': savoryPies[0],
        'Taste-savory': savoryPies[1],
        'Presentation-savory': savoryPies[0]
      }
    },
    {
      uid: 'test-voter-2',
      votes: {
        'PieZaz-sweet': sweetPies[0],
        'Taste-sweet': sweetPies[1],
        'Presentation-sweet': sweetPies[0],
        'PieZaz-savory': savoryPies[1],
        'Taste-savory': savoryPies[0],
        'Presentation-savory': savoryPies[1]
      }
    },
    {
      uid: 'test-voter-3',
      votes: {
        'PieZaz-sweet': sweetPies[2],
        'Taste-sweet': sweetPies[0],
        'Presentation-sweet': sweetPies[2],
        'PieZaz-savory': savoryPies[0],
        'Taste-savory': savoryPies[2],
        'Presentation-savory': savoryPies[2]
      }
    },
    {
      uid: 'test-voter-4',
      votes: {
        'PieZaz-sweet': sweetPies[1],
        'Taste-sweet': sweetPies[2],
        'Presentation-sweet': sweetPies[1],
        'PieZaz-savory': savoryPies[2],
        'Taste-savory': savoryPies[1],
        'Presentation-savory': savoryPies[0]
      }
    },
    {
      uid: 'test-voter-5',
      votes: {
        'PieZaz-sweet': sweetPies[0],
        'Taste-sweet': sweetPies[1],
        'Presentation-sweet': sweetPies[0],
        'PieZaz-savory': savoryPies[1],
        'Taste-savory': savoryPies[0],
        'Presentation-savory': savoryPies[1]
      }
    }
  ]
  
  // Write votes with specific UIDs
  for (const voter of mockVoters) {
    const voteRef = doc(db, 'votes', voter.uid)
    await setDoc(voteRef, {
      ...voter.votes,
      updatedAt: serverTimestamp()
    })
  }
}

/**
 * Clear all pies from the database
 */
export async function clearAllPies(): Promise<number> {
  const snapshot = await getDocs(piesCol())
  let count = 0
  
  for (const doc of snapshot.docs) {
    await deleteDoc(doc.ref)
    count++
  }
  
  return count
}

/**
 * Clear all votes from the database
 */
export async function clearAllVotes(): Promise<number> {
  const snapshot = await getDocs(votesCol())
  let count = 0
  
  for (const doc of snapshot.docs) {
    await deleteDoc(doc.ref)
    count++
  }
  
  return count
}

/**
 * Clear all winners from the database
 */
export async function clearAllWinners(): Promise<number> {
  const snapshot = await getDocs(winnersCol())
  let count = 0
  
  for (const doc of snapshot.docs) {
    await deleteDoc(doc.ref)
    count++
  }
  
  return count
}

/**
 * Clear all test data (pies, votes, winners)
 */
export async function clearAllTestData(): Promise<{ pies: number; votes: number; winners: number }> {
  const [pies, votes, winners] = await Promise.all([
    clearAllPies(),
    clearAllVotes(),
    clearAllWinners()
  ])
  
  return { pies, votes, winners }
}

// Scoring functions are now centralized in src/lib/scoring.ts
// Import them from there: calculateTallies, getOverallWinners, getAllPieScores
// This ensures consistent scoring logic across testing and production
export { calculateTallies, getOverallWinners } from './scoring'
