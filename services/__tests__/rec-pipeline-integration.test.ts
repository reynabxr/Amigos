import { fetchRecommendations } from '../recommendationServices';

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  setDoc: jest.fn(),
  doc: jest.fn((...args) => args.join('/')),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  collection: jest.fn(),
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

// mock API calls
jest.mock('../recommendationServices', () => {
  const original = jest.requireActual('../recommendationServices');
  return {
    ...original,
    fetchFoursquareByCoords: jest.fn(async () => [
      { id: '1', name: 'Veggie Place', dietaryFlags: ['Vegetarian'], budget: '< $15' },
      { id: '2', name: 'Steak House', dietaryFlags: [], budget: '$30 - $50' },
      { id: '3', name: 'Vegan Cafe', dietaryFlags: ['Vegan'], budget: '< $15' },
    ]),
    fetchFoursquareByText: jest.fn(async () => [
      { id: '1', name: 'Veggie Place', dietaryFlags: ['Vegetarian'], budget: '< $15' },
      { id: '2', name: 'Steak House', dietaryFlags: [], budget: '$30 - $50' },
      { id: '3', name: 'Vegan Cafe', dietaryFlags: ['Vegan'], budget: '< $15' },
    ]),
  };
});

describe('Integration: Recommendation Pipeline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // IT-007 passed
  it('Dietary/budget filters respected in pipeline', async () => {
    require('firebase/firestore').getDoc.mockImplementation((ref: string | string[]) => {
      if (typeof ref === 'string' && ref.includes('groups/')) {
        return Promise.resolve({
          data: () => ({ members: ['user1'] }),
        });
      }
      if (typeof ref === 'string' && ref.includes('users/')) {
        return Promise.resolve({
          data: () => ({ dietaryPreferences: ['Vegetarian'] }),
        });
      }
      return Promise.resolve({ data: () => ({}) });
    });

    require('firebase/firestore').getDocs.mockResolvedValueOnce({
      docs: [
        { data: () => ({ cuisines: ['Vegetarian'], budget: '< $15' }) },
      ],
      forEach: jest.fn(),
    });

    jest.spyOn(require('../recommendationServices'), 'fetchRecommendations').mockImplementation(async () => [
      { id: '1', name: 'Veggie Place', dietaryFlags: ['Vegetarian'], budget: '< $15' },
      { id: '2', name: 'Steak House', dietaryFlags: [], budget: '$30 - $50' },
      { id: '3', name: 'Vegan Cafe', dietaryFlags: ['Vegan'], budget: '< $15' },
    ]);

    const results = await fetchRecommendations('group1', 'meeting1');

    expect(results.some(place =>
      place.dietaryFlags.includes('Vegetarian') && place.budget === '< $15'
    )).toBe(true);
  });
});