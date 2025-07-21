// isolate Halal logic from fetchRecommendations
function filterByHalal(places: any[], reqs: string[]): any[] {
  if (reqs.includes('Halal')) {
    return places.filter(
      (p) => p.dietaryFlags.includes('Halal') || p.dietaryFlags.length === 0
    );
  }
  return places;
}

// isolate softer dietary preferences logic from fetchRecommendations
function ensureAtLeastTwoSoftTag(places: any[], tag: string): any[] {
  let tagPlaces = places.filter((p) => p.dietaryFlags.includes(tag));
  if (tagPlaces.length < 2) {
    tagPlaces = [
      ...tagPlaces,
      ...places
        .filter(
          (p) => !p.dietaryFlags.includes(tag) && p.dietaryFlags.length === 0
        )
        .slice(0, 2 - tagPlaces.length),
    ];
  }
  return tagPlaces;
}

// isolate cuisine prioritisation logic from fetchRecommendations
function sortByCuisine(places: any[], topCuisines: string[]): any[] {
  return [...places].sort((a, b) => {
    const aCuisineScore = topCuisines.some(
      (c) =>
        a.category.toLowerCase().includes(c.toLowerCase()) ||
        (a.cuisines || []).some((oc: string) => oc.toLowerCase() === c.toLowerCase())
    )
      ? 1
      : 0;
    const bCuisineScore = topCuisines.some(
      (c) =>
        b.category.toLowerCase().includes(c.toLowerCase()) ||
        (b.cuisines || []).some((oc: string) => oc.toLowerCase() === c.toLowerCase())
    )
      ? 1
      : 0;
    return bCuisineScore - aCuisineScore;
  });
}

// isolate budget prioritisation logic from fetchRecommendations
function sortByBudget(places: any[], topBudget: string): any[] {
  return [...places].sort((a, b) =>
    (b.budget === topBudget ? 1 : 0) - (a.budget === topBudget ? 1 : 0)
  );
}

// UT-008 passed
describe('filterByHalal', () => {
  it('filters by Halal preference', () => {
    const places = [
      { id: '1', dietaryFlags: ['Halal'] },
      { id: '2', dietaryFlags: [] },
      { id: '3', dietaryFlags: ['Vegetarian'] },
      { id: '4', dietaryFlags: ['Halal', 'Vegetarian'] },
    ];
    const filtered = filterByHalal(places, ['Halal']);
    expect(filtered.map((p) => p.id)).toEqual(['1', '2', '4']);
  });
});

// UT-009 passed
describe('ensureAtLeastTwoSoftTag', () => {
  it('returns at least 2 places for Vegetarian, padding with untagged if needed', () => {
    const places = [
      { id: '1', dietaryFlags: ['Vegetarian'] },
      { id: '2', dietaryFlags: [] },
      { id: '3', dietaryFlags: ['Halal'] },
      { id: '4', dietaryFlags: [] },
    ];
    const result = ensureAtLeastTwoSoftTag(places, 'Vegetarian');
    expect(result.length).toBe(2);
    expect(result.map((p) => p.id)).toEqual(['1', '2']);
  });

  it('returns only Vegetarian places if there are at least 2', () => {
    const places = [
      { id: '1', dietaryFlags: ['Vegetarian'] },
      { id: '2', dietaryFlags: ['Vegetarian'] },
      { id: '3', dietaryFlags: [] },
    ];
    const result = ensureAtLeastTwoSoftTag(places, 'Vegetarian');
    expect(result.length).toBe(2);
    expect(result.every((p) => p.dietaryFlags.includes('Vegetarian'))).toBe(true);
  });
});

// UT-010
describe('sortByCuisine', () => {
  it('sorts places so top cuisine appears first', () => {
    const places = [
      { id: '1', category: 'Japanese Restaurant', cuisines: ['Japanese'] },
      { id: '2', category: 'Italian Restaurant', cuisines: ['Italian'] },
      { id: '3', category: 'Japanese Restaurant', cuisines: ['Japanese'] },
      { id: '4', category: 'French Restaurant', cuisines: ['French'] },
    ];
    const topCuisines = ['Japanese'];
    const sorted = sortByCuisine(places, topCuisines);
    expect(sorted[0].cuisines).toContain('Japanese');
    expect(sorted[1].cuisines).toContain('Japanese');
  });
});

// UT-011
describe('sortByBudget', () => {
  it('sorts places so top budget appears first', () => {
    const places = [
      { id: '1', budget: '< $15' },
      { id: '2', budget: '$15 - $30' },
      { id: '3', budget: '< $15' },
    ];
    const sorted = sortByBudget(places, '< $15');
    expect(sorted[0].budget).toBe('< $15');
    expect(sorted[1].budget).toBe('< $15');
  });
});