import { fetchRecommendations, fetchManual } from '../recommendationServices';

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  setDoc: jest.fn(),
  addDoc: jest.fn(),
  doc: jest.fn((...args) => args.join('/')),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  collection: jest.fn((...args) => args.join('/')),
}));

jest.mock('firebase/auth', () => ({
  getReactNativePersistence: jest.fn(() => ({})),
  initializeAuth: jest.fn(() => ({})),
  createUserWithEmailAndPassword: jest.fn(),
  updateProfile: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  mergeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
  multiMerge: jest.fn(),
}));

// @ts-ignore
global.fetch = jest.fn(async (url) => {
  if (typeof url === 'string' && url.includes('overpass-api.de')) {
    return {
      ok: true,
      text: async () => '{"elements":[]}',
    } as unknown as Response;
  }
  return {
    ok: true,
    json: async () => [],
    text: async () => '[]',
  } as unknown as Response;
});

describe('Integration: Manual Restaurant Suggestion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // IT-008 passed
  it('Manual restaurant suggestion is added and shown', async () => {
    require('firebase/firestore').getDocs.mockImplementation((colRef: any) => {
    if (typeof colRef === 'string' && colRef.endsWith('manualSuggestions')) {
        return Promise.resolve({
        docs: [
            {
            id: 'manual1',
            data: () => ({
                id: 'manual1',
                name: 'Manual Sushi',
                address: '123 Sushi St',
                lat: 1.3,
                lng: 103.8,
                category: 'Japanese',
                budget: '< $15',
                dietaryFlags: ['Vegetarian'],
                suggestedBy: 'user1',
                createdAt: Date.now(),
            }),
            },
        ],
        forEach: function (cb: any) { this.docs.forEach(cb); },
        });
  }
    if (typeof colRef === 'string' && colRef.includes('preferences')) {
        return Promise.resolve({
        docs: [
            { data: () => ({ cuisines: ['Vegetarian'], budget: '< $15' }) },
        ],
        forEach: function (cb: any) { this.docs.forEach(cb); },
        });
    }
    return Promise.resolve({ docs: [], forEach: function () {} });
    });

    require('firebase/firestore').getDoc.mockImplementation((ref: string | string[]) => {
      if (typeof ref === 'string' && ref.includes('groups/')) {
        return Promise.resolve({
          exists: () => true,
          data: () => ({ members: ['user1'] }),
        });
      }
      if (typeof ref === 'string' && ref.includes('users/')) {
        return Promise.resolve({
          exists: () => true,
          data: () => ({ dietaryPreferences: ['Vegetarian'] }),
        });
      }
      if (typeof ref === 'string' && ref.includes('meetings/')) {
        return Promise.resolve({
          exists: () => true,
          data: () => ({
            lat: 1.3,
            lng: 103.8,
            location: 'Test Location',
          }),
        });
      }
      return Promise.resolve({ exists: () => false, data: () => ({}) });
    });

    const recommendationServices = require('../recommendationServices');
    jest.spyOn(recommendationServices, 'fetchFoursquareByCoords').mockImplementation(async () => []);
    jest.spyOn(recommendationServices, 'fetchFoursquareByText').mockImplementation(async () => []);

    const manual = await fetchManual('group1', 'meeting1');
    console.log('Manual suggestions:', manual);

    const results = await fetchRecommendations('group1', 'meeting1');
    console.log('Results:', results);

    expect(results.some(place => place.name === 'Manual Sushi')).toBe(true);
  });
});
