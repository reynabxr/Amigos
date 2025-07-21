import { Timestamp } from 'firebase/firestore'

// suggestion manually added by a user
export interface ManualSuggestion {
  id?: string
  name: string
  address: string
  lat: number
  lng: number
  category: string
  budget: string
  dietaryFlags: string[]
  suggestedBy: string // UID of suggester
  createdAt: Timestamp
}

// vote record
export interface Vote {
  id?: string // "{memberId}_{restaurantId}"
  memberId: string
  restaurantId: string
  vote: boolean
  updatedAt: Timestamp
}

// the place that will be swiped on
export interface Place {
  id: string // fsq_place_id or manual id
  name: string
  address: string
  lat: number
  lng: number
  category: string
  cuisines: string[]
  budget: string
  dietaryFlags: string[]
  categoryIcon?: string; // Foursquare category icon fallback
}
