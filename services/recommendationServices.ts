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

// full recommendation pipeline
export async function fetchRecommendations(
  groupId: string,
  meetingId: string
): Promise<Place[]> {
  // 1. Manual suggestions
  const manual = await fetchManual(groupId, meetingId);

  // 2. Meeting doc for coords/text
  const mSnap = await getDoc(doc(db, 'groups', groupId, 'meetings', meetingId));
  const m = mSnap.exists() ? (mSnap.data() as any) : {};
  const lat = m.lat as number | undefined;
  const lng = m.lng as number | undefined;
  const txt = m.location as string | undefined;

  // 3. Fetch Foursquare
  let fsqList: Place[] = [];
  try {
    if (typeof lat === 'number' && typeof lng === 'number') {
      fsqList = await fetchFoursquareByCoords(lat, lng);
    } else if (typeof txt === 'string') {
      fsqList = await fetchFoursquareByText(txt);
    } else {
      throw new Error('No coords or text for FSQ lookup');
    }
  } catch (e: any) {
    console.warn('FSQ fetch failed:', e.message);
    fsqList = await fetchFoursquareByCoords(1.3521, 103.8198); // fallback: Singapore center
  }

  // 4. Enrich with OSM dietary tags and cuisines
  await Promise.all(
    fsqList.map(async (p: Place) => {
      const { dietaryFlags, cuisines } = await enrichWithOsmFlags(p.lat, p.lng);
      p.dietaryFlags = dietaryFlags;
      p.cuisines = cuisines;
    })
  );

  // 5. Fetch group dietary restrictions and preferences
  const reqs = await fetchGroupRestrictions(groupId); // e.g. ["Halal", "Vegetarian", "Vegan", ...]
  const prefsSnap = await getDocs(
    collection(db, 'groups', groupId, 'meetings', meetingId, 'preferences')
  );
  let cuisineCounts: Record<string, number> = {};
  let budgetCounts: Record<string, number> = {};
  prefsSnap.forEach((doc) => {
    const data = doc.data();
    (data.cuisines || []).forEach((c: string) => {
      cuisineCounts[c] = (cuisineCounts[c] || 0) + 1;
    });
    if (data.budget) {
      budgetCounts[data.budget] = (budgetCounts[data.budget] || 0) + 1;
    }
  });
  const topCuisines = Object.entries(cuisineCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([c]) => c);
  const topBudgets = Object.entries(budgetCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([b]) => b);

  // Halal filtering that includes explicitly Halal or not tagged
  if (reqs.includes('Halal')) {
  fsqList = fsqList.filter(
    (p: Place) =>
      p.dietaryFlags.includes('Halal') ||
      p.dietaryFlags.length === 0 // allow untagged
  );
  // sort so Halal-tagged appear first
  fsqList.sort((a, b) => {
    const aHalal = a.dietaryFlags.includes('Halal') ? 1 : 0;
    const bHalal = b.dietaryFlags.includes('Halal') ? 1 : 0;
    return bHalal - aHalal;
  });
}

  // Soft tags (Vegetarian, Vegan, etc): ensure at least 2 of each if requested
  const softTags = ['Vegetarian', 'Vegan', 'Kosher', 'Gluten-free', 'Lactose-free', 'Pescetarian', 'Nut-free', 'Egg-free', 'Soy-free'];
  const map = new Map<string, Place>();
  manual.forEach((p: Place) => map.set(p.id, p));
  softTags.forEach(tag => {
    if (reqs.includes(tag)) {
      let tagPlaces = fsqList.filter((p: Place) => p.dietaryFlags.includes(tag));
      if (tagPlaces.length < 2) {
        tagPlaces = [
          ...tagPlaces,
          ...fsqList
            .filter(
              (p: Place) =>
                !p.dietaryFlags.includes(tag) && p.dietaryFlags.length === 0
            )
            .slice(0, 2 - tagPlaces.length),
        ];
      }
      tagPlaces.forEach((p: Place) => map.set(p.id, p));
    }
  });
  fsqList.forEach((p: Place) => map.set(p.id, p));
  let merged = Array.from(map.values());

  // Sort by cuisine and budget preferences (prioritise, not filter)
  merged.sort((a, b) => {
    // Cuisine boost: match either Foursquare category or any OSM cuisine
    const aCuisineScore =
      topCuisines.some(
        (c) =>
          a.category.toLowerCase().includes(c.toLowerCase()) ||
          (a.cuisines || []).some((oc) => oc.toLowerCase() === c.toLowerCase())
      )
        ? 1
        : 0;
    const bCuisineScore =
      topCuisines.some(
        (c) =>
          b.category.toLowerCase().includes(c.toLowerCase()) ||
          (b.cuisines || []).some((oc) => oc.toLowerCase() === c.toLowerCase())
      )
        ? 1
        : 0;
    // Budget boost
    const aBudgetScore = topBudgets.includes(a.budget) ? 1 : 0;
    const bBudgetScore = topBudgets.includes(b.budget) ? 1 : 0;
    // Soft dietary boost
    const aSoft = softTags.some((tag) => reqs.includes(tag) && a.dietaryFlags.includes(tag)) ? 1 : 0;
    const bSoft = softTags.some((tag) => reqs.includes(tag) && b.dietaryFlags.includes(tag)) ? 1 : 0;
    return (
      bSoft - aSoft ||
      bCuisineScore - aCuisineScore ||
      bBudgetScore - aBudgetScore
    );
  });

  console.log('✅ Recommendations:', merged);
  return merged;
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

