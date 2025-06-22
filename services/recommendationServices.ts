// services/recommendationService.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db } from './firebaseConfig'
import {
  FSQ_API_VERSION,
  FSQ_BASE,
  FSQ_TOKEN,
} from './foursquareConfig'
import type { Place } from './types'

// read manual suggestions
export async function fetchManual(
  groupId: string,
  meetingId: string
): Promise<Place[]> {
  const snap = await getDocs(
    collection(
      db,
      'groups',
      groupId,
      'meetings',
      meetingId,
      'manualSuggestions'
    )
  )
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as any),
  }))
}

// query suggestions from Foursquare

// services/recommendationService.ts
export async function fetchFoursquare(
  near: string,
  limit = 20
): Promise<Place[]> {
  const qs = new URLSearchParams({
    near,
    limit: String(limit),
    query: 'restaurant',
  });
  const res = await fetch(`${FSQ_BASE}/search?${qs}`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'X-Places-Api-Version': FSQ_API_VERSION,
      authorization: FSQ_TOKEN,
    },
  });
  if (!res.ok) throw new Error(`FSQ ${res.status}`);
  const json = await res.json();

  const places: Place[] = [];
  for (const r of json.results||[]) {
    // try geocodes.main first, then top-level latitude
    const lat =
      typeof r.geocodes?.main?.latitude === 'number'
        ? r.geocodes.main.latitude
        : typeof r.latitude === 'number'
          ? r.latitude
          : undefined;
    const lng =
      typeof r.geocodes?.main?.longitude === 'number'
        ? r.geocodes.main.longitude
        : typeof r.longitude === 'number'
          ? r.longitude
          : undefined;
    if (lat == null || lng == null) continue;

    // build a display address
    const address =
      r.location?.formatted_address ||
      [r.location?.address, r.location?.locality].filter(Boolean).join(', ');

    places.push({
      id: r.fsq_place_id,
      name: r.name,
      address,
      lat,
      lng,
      category: r.categories?.[0]?.name || 'Unknown',
      budget: r.price?.currency || '',
      dietaryFlags: [],
    });
  }
  return places;
}

// consider OSM diet tags
// services/recommendationService.ts
const OSM_URL = 'https://overpass-api.de/api/interpreter'

export async function enrichWithOsmFlags(
  lat: number,
  lng: number
): Promise<string[]> {
  const query = `
    [out:json][timeout:25];
    node(around:50,${lat},${lng})
      ["amenity"="restaurant"]["diet:vegetarian"];
    node(around:50,${lat},${lng})
      ["amenity"="restaurant"]["diet:vegan"];
    node(around:50,${lat},${lng})
      ["amenity"="restaurant"]["diet:halal"];
    out tags;`

  try {
    const res = await fetch(OSM_URL + '?data=' + encodeURIComponent(query))
    const text = await res.text()
    // quick guard: Overpass sometimes returns HTML on error
    if (!text.trim().startsWith('{')) {
      console.warn('OSM returned non-JSON, skipping enrichment:', text.slice(0,200))
      return []
    }
    const data = JSON.parse(text) as any
    const flags = new Set<string>()
    for (const el of data.elements || []) {
      const tags = el.tags || {}
      if (tags['diet:vegetarian']) flags.add('Vegetarian')
      if (tags['diet:vegan'])       flags.add('Vegan')
      if (tags['diet:halal'])       flags.add('Halal')
    }
    return Array.from(flags)
  } catch (e) {
    console.warn('OSM enrichment failed:', e)
    return []
  }
}

// load group-wide preferences
export async function fetchGroupRestrictions(
  groupId: string
): Promise<string[]> {
  const grp = await getDoc(doc(db, 'groups', groupId))
  const members: string[] = grp.data()?.members || []
  const all = await Promise.all(
    members.map(async (uid) => {
      const u = await getDoc(doc(db, 'users', uid))
      return u.data()?.dietaryPreferences || []
    })
  )
  return all.flat()
}

// generate final recommendations
export async function fetchRecommendations(
  groupId: string,
  meetingId: string,
  near: string
): Promise<Place[]> {
  const [manual, fsq] = await Promise.all([
    fetchManual(groupId, meetingId),
    fetchFoursquare(near),
  ])
  await Promise.all(
    fsq.map(async (p) => {
      p.dietaryFlags = await enrichWithOsmFlags(p.lat, p.lng)
    })
  )
 const reqs = await fetchGroupRestrictions(groupId)

// allow any place with NO tags, or that satisfies all reqs
const filtered = reqs.length
  ? fsq.filter(p =>
      p.dietaryFlags.length === 0 ||
      reqs.every(r => p.dietaryFlags.includes(r))
    )
  : fsq
  const map = new Map<string, Place>()
  ;[...manual, ...filtered].forEach((p) => map.set(p.id, p))
  return Array.from(map.values())
}

// record a vote
export async function recordVote(
  groupId: string,
  meetingId: string,
  memberId: string,
  restaurantId: string,
  vote: boolean
) {
  const id = `${memberId}_${restaurantId}`
  await setDoc(
    doc(
      db,
      'groups',
      groupId,
      'meetings',
      meetingId,
      'votes',
      id
    ),
    { memberId, restaurantId, vote, updatedAt: serverTimestamp() }
  )
}

// check consensus
export async function getConsensus(
  groupId: string,
  meetingId: string
): Promise<{ status: 'none' | 'chosen' | 'top'; restaurantId?: string }> {
  const grp = await getDoc(doc(db, 'groups', groupId))
  const total = (grp.data()?.members || []).length
  const snap = await getDocs(
    collection(db, 'groups', groupId, 'meetings', meetingId, 'votes')
  )
  const tally: Record<string, { yes: number; no: number }> = {}
  snap.docs.forEach((d) => {
    const { restaurantId, vote } = d.data() as any
    tally[restaurantId] ??= { yes: 0, no: 0 }
    vote ? tally[restaurantId].yes++ : tally[restaurantId].no++
  })
  for (const rid in tally) {
    if (tally[rid].yes === total) return { status: 'chosen', restaurantId: rid }
  }
  const sorted = Object.entries(tally).sort((a, b) => b[1].yes - a[1].yes)
  if (sorted.length) return { status: 'top', restaurantId: sorted[0][0] }
  return { status: 'none' }
}