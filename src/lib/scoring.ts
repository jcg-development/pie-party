// src/lib/scoring.ts
/**
 * Scoring utilities for determining pie competition winners
 */
import { CATEGORIES } from './config'

/**
 * Calculate vote tallies for all categories
 */
export function calculateTallies(votes: any[]): Record<string, Record<string, number>> {
  const tallies: Record<string, Record<string, number>> = {}
  
  // Initialize tallies for all categories
  CATEGORIES.forEach(cat => {
    tallies[`${cat}-sweet`] = {}
    tallies[`${cat}-savory`] = {}
  })
  
  // Count votes
  votes.forEach(vote => {
    CATEGORIES.forEach(cat => {
      const sweetKey = `${cat}-sweet`
      const savoryKey = `${cat}-savory`
      
      if (vote[sweetKey]) {
        tallies[sweetKey][vote[sweetKey]] = (tallies[sweetKey][vote[sweetKey]] || 0) + 1
      }
      if (vote[savoryKey]) {
        tallies[savoryKey][vote[savoryKey]] = (tallies[savoryKey][vote[savoryKey]] || 0) + 1
      }
    })
  })
  
  return tallies
}

/**
 * Get overall winners by combining all category votes
 * This is the MAIN scoring function used for determining competition winners
 * Returns one winner for sweet and one for savory
 */
export function getOverallWinners(
  pies: any[],
  votes: any[]
): {
  sweet: { pie: any; totalVotes: number; breakdown: Record<string, number> } | null;
  savory: { pie: any; totalVotes: number; breakdown: Record<string, number> } | null;
} {
  const tallies = calculateTallies(votes)
  
  // Calculate total votes per pie for each type
  const sweetTotals: Record<string, { total: number; breakdown: Record<string, number> }> = {}
  const savoryTotals: Record<string, { total: number; breakdown: Record<string, number> }> = {}
  
  // Combine votes across all categories for sweet pies
  CATEGORIES.forEach(cat => {
    const sweetKey = `${cat}-sweet`
    const categoryTallies = tallies[sweetKey]
    
    Object.entries(categoryTallies).forEach(([pieId, count]) => {
      if (!sweetTotals[pieId]) {
        sweetTotals[pieId] = { total: 0, breakdown: {} }
      }
      sweetTotals[pieId].total += count
      sweetTotals[pieId].breakdown[cat] = count
    })
  })
  
  // Combine votes across all categories for savory pies
  CATEGORIES.forEach(cat => {
    const savoryKey = `${cat}-savory`
    const categoryTallies = tallies[savoryKey]
    
    Object.entries(categoryTallies).forEach(([pieId, count]) => {
      if (!savoryTotals[pieId]) {
        savoryTotals[pieId] = { total: 0, breakdown: {} }
      }
      savoryTotals[pieId].total += count
      savoryTotals[pieId].breakdown[cat] = count
    })
  })
  
  // Find sweet winner
  let sweetWinner: { pie: any; totalVotes: number; breakdown: Record<string, number> } | null = null
  let maxSweetVotes = 0
  
  Object.entries(sweetTotals).forEach(([pieId, data]) => {
    if (data.total > maxSweetVotes) {
      const pie = pies.find(p => p.id === pieId)
      if (pie) {
        maxSweetVotes = data.total
        sweetWinner = {
          pie,
          totalVotes: data.total,
          breakdown: data.breakdown
        }
      }
    }
  })
  
  // Find savory winner
  let savoryWinner: { pie: any; totalVotes: number; breakdown: Record<string, number> } | null = null
  let maxSavoryVotes = 0
  
  Object.entries(savoryTotals).forEach(([pieId, data]) => {
    if (data.total > maxSavoryVotes) {
      const pie = pies.find(p => p.id === pieId)
      if (pie) {
        maxSavoryVotes = data.total
        savoryWinner = {
          pie,
          totalVotes: data.total,
          breakdown: data.breakdown
        }
      }
    }
  })
  
  return {
    sweet: sweetWinner,
    savory: savoryWinner
  }
}

/**
 * Get all pies with their combined vote totals (for leaderboard display)
 */
export function getAllPieScores(
  pies: any[],
  votes: any[]
): {
  sweet: Array<{ pie: any; totalVotes: number; breakdown: Record<string, number> }>;
  savory: Array<{ pie: any; totalVotes: number; breakdown: Record<string, number> }>;
} {
  const tallies = calculateTallies(votes)
  
  // Calculate total votes per pie for each type
  const sweetTotals: Record<string, { total: number; breakdown: Record<string, number> }> = {}
  const savoryTotals: Record<string, { total: number; breakdown: Record<string, number> }> = {}
  
  // Combine votes across all categories for sweet pies
  CATEGORIES.forEach(cat => {
    const sweetKey = `${cat}-sweet`
    const categoryTallies = tallies[sweetKey]
    
    Object.entries(categoryTallies).forEach(([pieId, count]) => {
      if (!sweetTotals[pieId]) {
        sweetTotals[pieId] = { total: 0, breakdown: {} }
      }
      sweetTotals[pieId].total += count
      sweetTotals[pieId].breakdown[cat] = count
    })
  })
  
  // Combine votes across all categories for savory pies
  CATEGORIES.forEach(cat => {
    const savoryKey = `${cat}-savory`
    const categoryTallies = tallies[savoryKey]
    
    Object.entries(categoryTallies).forEach(([pieId, count]) => {
      if (!savoryTotals[pieId]) {
        savoryTotals[pieId] = { total: 0, breakdown: {} }
      }
      savoryTotals[pieId].total += count
      savoryTotals[pieId].breakdown[cat] = count
    })
  })
  
  // Convert to arrays and sort by total votes
  const sweetList = Object.entries(sweetTotals)
    .map(([pieId, data]) => {
      const pie = pies.find(p => p.id === pieId)
      return pie ? {
        pie,
        totalVotes: data.total,
        breakdown: data.breakdown
      } : null
    })
    .filter(Boolean)
    .sort((a, b) => b!.totalVotes - a!.totalVotes) as Array<{ pie: any; totalVotes: number; breakdown: Record<string, number> }>
  
  const savoryList = Object.entries(savoryTotals)
    .map(([pieId, data]) => {
      const pie = pies.find(p => p.id === pieId)
      return pie ? {
        pie,
        totalVotes: data.total,
        breakdown: data.breakdown
      } : null
    })
    .filter(Boolean)
    .sort((a, b) => b!.totalVotes - a!.totalVotes) as Array<{ pie: any; totalVotes: number; breakdown: Record<string, number> }>
  
  return {
    sweet: sweetList,
    savory: savoryList
  }
}
