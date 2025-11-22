export const CATEGORIES = ['PieZaz', 'Taste', 'Presentation'] as const
export type Category = typeof CATEGORIES[number]

// RSVP Pie Type Caps
export const PIE_TYPE_CAPS = {
  sweet: 15,   // Maximum number of sweet pies allowed
  savory: 10   // Maximum number of savory pies allowed
} as const

export type PieType = 'sweet' | 'savory'
