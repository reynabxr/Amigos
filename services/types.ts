import { Timestamp } from 'firebase/firestore'

// A suggestion manually added by a user
export interface ManualSuggestion {
  id?: string
  name: string
  address: string
  lat: number
  lng: number
  category: string
  budget: string
  dietaryFlags: string[]
  suggestedBy: string    // UID of suggester
  createdAt: Timestamp
}

// A vote record
export interface Vote {
  id?: string            // "{memberId}_{restaurantId}"
  memberId: string
  restaurantId: string
  vote: boolean
  updatedAt: Timestamp
}

// The “Place” that will be swiped on
export interface Place {
  id: string             // fsq_place_id or manual id
  name: string
  address: string
  lat: number
  lng: number
  category: string
  budget: string
  dietaryFlags: string[]
}
