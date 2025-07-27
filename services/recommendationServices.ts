import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc
} from 'firebase/firestore'
import { db } from './firebaseConfig'
import {
  FSQ_API_VERSION,
  FSQ_BASE,
  FSQ_TOKEN,
} from './foursquareConfig'
import type { Place } from './types'

// Minimum average score below which a place is excluded
const MIN_SCORE_THRESHOLD = 2.5

export function mapFoursquarePriceToBudget(priceLevel: number | undefined): string {
  switch (priceLevel) {
    case 1: return '< $15'
    case 2: return '$15 - $30'
    case 3: return '$30 - $50'
    case 4: return '> $50'
    default: return ''
  }
}

// Manual suggestions
export async function fetchManual(
  groupId: string,
  meetingId: string
): Promise<Place[]> {
  const snap = await getDocs(
    collection(db, 'groups', groupId, 'meetings', meetingId, 'manualSuggestions')
  )
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as any),
  }))
}

// Foursquare by coords
async function fetchFoursquareByCoords(
  lat: number,
  lng: number,
  limit = 20
): Promise<Place[]> {
  const qs = new URLSearchParams({
    ll: `${lat},${lng}`,
    limit: String(limit),
    query: 'restaurant',
  })
  const res = await fetch(`${FSQ_BASE}/search?${qs.toString()}`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'X-Places-Api-Version': FSQ_API_VERSION,
      authorization: FSQ_TOKEN,
    },
  })
  if (!res.ok) throw new Error(`Foursquare error ${res.status}`)
  const json = await res.json()
  return (json.results || []).map((r: any) => {
    const latitude = r.geocodes?.main?.latitude ?? r.latitude
    const longitude = r.geocodes?.main?.longitude ?? r.longitude
    const address =
      r.location?.formatted_address ||
      [r.location?.address, r.location?.locality].filter(Boolean).join(', ')
    const categoryIcon = r.categories?.[0]?.icon
  ? `${r.categories[0].icon.prefix}bg_120${r.categories[0].icon.suffix}`
  : undefined;
    return {
      id: r.fsq_place_id,
      name: r.name,
      address,
      lat: latitude,
      lng: longitude,
      category: r.categories?.[0]?.name ?? 'Unknown',
      cuisines: [], // will be filled by OSM
      budget: mapFoursquarePriceToBudget(r.price?.tier),
      dietaryFlags: [],
      categoryIcon,
    } as Place
  })
}

//  Foursquare by text (fallback if no coords)
async function fetchFoursquareByText(
  near: string,
  limit = 20
): Promise<Place[]> {
  const qs = new URLSearchParams({
    near,
    limit: String(limit),
    query: 'restaurant',
  })
  const res = await fetch(`${FSQ_BASE}/search?${qs.toString()}`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'X-Places-Api-Version': FSQ_API_VERSION,
      authorization: FSQ_TOKEN,
    },
  })
  if (!res.ok) throw new Error(`Foursquare error ${res.status}`)
  const json = await res.json()
  return (json.results || [])
    .map((r: any) => {
      const latitude: number | undefined =
        r.geocodes?.main?.latitude ?? r.latitude
      const longitude: number | undefined =
        r.geocodes?.main?.longitude ?? r.longitude
      if (typeof latitude !== 'number' || typeof longitude !== 'number')
        return null
      const address: string =
        r.location?.formatted_address ||
        [r.location?.address, r.location?.locality].filter(Boolean).join(', ')
      const categoryIcon = r.categories?.[0]?.icon
        ? `${r.categories[0].icon.prefix}bg_120${r.categories[0].icon.suffix}`
        : undefined;
      return {
        id: r.fsq_place_id,
        name: r.name,
        address,
        lat: latitude,
        lng: longitude,
        category: r.categories?.[0]?.name ?? 'Unknown',
        cuisines: [],
        budget: mapFoursquarePriceToBudget(r.price?.tier),
        dietaryFlags: [],
        categoryIcon,
      } as Place
    })
    .filter((p: Place | null): p is Place => p !== null)

}

// 3) OSM diet tags enrichment
const OSM_URL = 'https://overpass-api.de/api/interpreter'
const OSM_DIET_TAGS = [
  'vegetarian', 'vegan', 'halal', 'kosher', 'gluten_free', 'lactose_free',
  'pescetarian', 'nut_free', 'egg_free', 'soy_free'
];

export async function enrichWithOsmFlags(
  lat: number,
  lng: number
): Promise<{ dietaryFlags: string[], cuisines: string[] }> {
  const query = `
    [out:json][timeout:25];
    node(around:50,${lat},${lng})["amenity"="restaurant"];
    out tags;`
  try {
    const res = await fetch(OSM_URL + '?data=' + encodeURIComponent(query))
    const text = await res.text()
    if (!text.trim().startsWith('{')) {
      console.warn('OSM returned non-JSON:', text.slice(0, 200))
      return { dietaryFlags: [], cuisines: [] }
    }
    const data = JSON.parse(text) as any
    const flags = new Set<string>()
    const cuisines = new Set<string>()
    for (const el of data.elements || []) {
      const tags = el.tags || {}
      for (const tag of OSM_DIET_TAGS) {
        if (tags[`diet:${tag}`]) {
          // e.g. "Gluten_free" → "Gluten-free"
          flags.add(tag.replace('_', '-').replace(/^\w/, c => c.toUpperCase()))
        }
      }
      if (tags['cuisine']) {
        tags['cuisine'].split(';').forEach((c: string) =>
          cuisines.add(c.trim().replace(/^\w/, x => x.toUpperCase()))
        )
      }
    }
    return { dietaryFlags: Array.from(flags), cuisines: Array.from(cuisines) }
  } catch (e) {
    console.warn('OSM enrichment failed:', e)
    return { dietaryFlags: [], cuisines: [] }
  }
}

// 4) Group-wide dietary restrictions
export async function fetchGroupRestrictions(
  groupId: string
): Promise<string[]> {
  const grpSnap = await getDoc(doc(db, 'groups', groupId))
  const members: string[] = grpSnap.data()?.members || []
  const all = await Promise.all(
    members.map(async (uid) => {
      const uSnap = await getDoc(doc(db, 'users', uid))
      return uSnap.data()?.dietaryPreferences || []
    })
  )
  return all.flat()
}

// fetch image of restaurant
export async function fetchFoursquarePhoto(fsqId: string): Promise<string | undefined> {
  if (!fsqId) return undefined;
  const res = await fetch(
    `https://api.foursquare.com/v3/places/${fsqId}/photos?limit=1`,
    {
      headers: {
        accept: 'application/json',
        'X-Places-Api-Version': FSQ_API_VERSION,
        authorization: FSQ_TOKEN,
      },
    }
  );
  if (!res.ok) return undefined;
  const photos = await res.json();
  if (photos.length > 0) {
    const photo = photos[0];
    return `${photo.prefix}original${photo.suffix}`;
  }
  return undefined;
}
// 1) Build the taste profile
async function fetchGroupTasteProfile(groupId: string) {
  const grpSnap = await getDoc(doc(db, 'groups', groupId))
  const members: string[] = grpSnap.data()?.members || []

  const categoryScores = new Map<string, { total: number; count: number }>()
  const cuisineScores  = new Map<string, { total: number; count: number }>()

  await Promise.all(
    members.map(async (uid) => {
      const ratingsSnap = await getDocs(collection(db, 'users', uid, 'ratings'))
      ratingsSnap.docs.forEach((d) => {
        const { rating, category, cuisines } = d.data() as any
        if (rating >= 1) {
          // category
          if (category) {
            const cur = categoryScores.get(category) || { total: 0, count: 0 }
            cur.total += rating
            cur.count += 1
            categoryScores.set(category, cur)
          }
          // cuisines
          ;(cuisines || []).forEach((c: string) => {
            const cur = cuisineScores.get(c) || { total: 0, count: 0 }
            cur.total += rating
            cur.count += 1
            cuisineScores.set(c, cur)
          })
        }
      })
    })
  )

  return { categoryScores, cuisineScores }
}

// 2) Score function
function scorePlace(
  p: Place,
  profile: { categoryScores: Map<string, {total:number;count:number}>;
             cuisineScores : Map<string, {total:number;count:number}> },
  explicitCuisines: string[],
  explicitBudgets: string[]
): number {
  let score = 0
  // learned category avg
  const cat = profile.categoryScores.get(p.category)
  if (cat) score += cat.total / cat.count

  // learned cuisine max avg
  const cScores = explicitCuisines.map((c) => {
    const info = profile.cuisineScores.get(c)
    return info ? info.total / info.count : 0
  })
  score += Math.max(0, ...cScores)

  // budget boost
  if (explicitBudgets.includes(p.budget)) score += 1

  // exploration bonus
  if (!profile.categoryScores.has(p.category)) score += 0.2

  return score
}

// 3) Full pipeline with filtering
export async function fetchRecommendations(
  groupId: string,
  meetingId: string
): Promise<Place[]> {
  // a) get manual + FSQ candidates
  const manual = await fetchManual(groupId, meetingId)
  const mSnap = await getDoc(doc(db, 'groups', groupId, 'meetings', meetingId))
  const m = mSnap.exists() ? (mSnap.data() as any) : {}
  let fsqList: Place[] = []
  try {
    if (typeof m.lat === 'number' && typeof m.lng === 'number') {
      fsqList = await fetchFoursquareByCoords(m.lat, m.lng)
    } else if (m.location) {
      fsqList = await fetchFoursquareByText(m.location)
    }
  } catch {
    fsqList = await fetchFoursquareByCoords(1.3521, 103.8198)
  }
  await Promise.all(
    fsqList.map(async (p) => {
      const { dietaryFlags, cuisines } = await enrichWithOsmFlags(p.lat, p.lng)
      p.dietaryFlags = dietaryFlags
      p.cuisines = cuisines
    })
  )

  // b) hard filter
  const reqs = await fetchGroupRestrictions(groupId)
  const hard = fsqList.filter((p) =>
    reqs.every((r) => p.dietaryFlags.includes(r))
  )

  // c) merge & dedupe
  const map = new Map<string, Place>()
  ;[...manual, ...hard].forEach((p) => map.set(p.id, p))
  const merged = Array.from(map.values())

  // d) explicit meeting prefs
  const prefsSnap = await getDocs(
    collection(db, 'groups', groupId, 'meetings', meetingId, 'preferences')
  )
  const explicitCuisines: string[] = []
  const explicitBudgets: string[] = []
  prefsSnap.docs.forEach((d) => {
    const data = d.data() as any
    explicitCuisines.push(...(data.cuisines || []))
    if (data.budget) explicitBudgets.push(data.budget)
  })

  // e) **await** the taste profile!
  const profile = await fetchGroupTasteProfile(groupId)

  // f) score & threshold filter
  const scored = merged
    .map((p) => ({ place: p, score: scorePlace(p, profile, explicitCuisines, explicitBudgets) }))
    .filter((x) => x.score >= MIN_SCORE_THRESHOLD)

  // g) sort
  scored.sort((a, b) => b.score - a.score)
  return scored.map((x) => x.place)
}

// 6) Record a swipe vote
export async function recordVote(
  groupId: string,
  meetingId: string,
  memberId: string,
  restaurantId: string,
  vote: boolean
) {
  const id = `${memberId}_${restaurantId}`
  await setDoc(
    doc(db, 'groups', groupId, 'meetings', meetingId, 'votes', id),
    { memberId, restaurantId, vote, updatedAt: serverTimestamp() }
  )
}

// returns an array of restaurant IDs
export async function getConsensus(
  groupId: string,
  meetingId: string
): Promise<{ status: 'none' | 'chosen' | 'top'; restaurantIds?: string[] }> {
  const grpSnap = await getDoc(doc(db, 'groups', groupId));
  const total = (grpSnap.data()?.members || []).length;
  const voteSnap = await getDocs(
    collection(db, 'groups', groupId, 'meetings', meetingId, 'votes')
  );

  const tally: Record<string, { yes: number; no: number }> = {};
  voteSnap.docs.forEach((d) => {
    const { restaurantId, vote } = d.data() as any;
    tally[restaurantId] ??= { yes: 0, no: 0 };
    vote ? tally[restaurantId].yes++ : tally[restaurantId].no++;
  });

  // Check for unanimous votes
  const unanimousRestaurants = Object.entries(tally)
    .filter(([_, counts]) => counts.yes === total)
    .map(([id, _]) => id);
  if (unanimousRestaurants.length > 0) {
    return { status: 'chosen', restaurantIds: unanimousRestaurants };
  }

  // Top-voted: find the maximum yes value, then return all IDs with that value.
  const sorted = Object.entries(tally).sort((a, b) => b[1].yes - a[1].yes);
  if (sorted.length > 0) {
    const topYes = sorted[0][1].yes;
    const topRestaurants = sorted
      .filter(([_, counts]) => counts.yes === topYes)
      .map(([id, _]) => id);
    return { status: 'top', restaurantIds: topRestaurants };
  }
  return { status: 'none' };
}
