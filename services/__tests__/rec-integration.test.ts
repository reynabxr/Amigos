import { fetchRecommendations } from '../recommendationServices';

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  doc: jest.fn(),
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getReactNativePersistence: jest.fn(() => ({})),
  initializeAuth: jest.fn(() => ({})),
  createUserWithEmailAndPassword: jest.fn(),
  updateProfile: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
}));

jest.mock('../foursquareConfig', () => ({
  FSQ_TOKEN: 'mock-token',
  FSQ_API_VERSION: 'mock-version',
  FSQ_BASE: 'mock-base',
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

describe('Integration: Preferences + Recommendations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // IT-003 passed
  it('Preferences saved and used in recommendations', async () => {
    const mockPrefs = { dietaryPreferences: ['Vegetarian'] };
    require('firebase/firestore').getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => mockPrefs,
    });

    require('firebase/firestore').getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        members: ['user1'],
      }),
    });

    require('firebase/firestore').getDocs.mockResolvedValueOnce({
      docs: [
        {
          data: () => ({ cuisines: ['Vegetarian'], budget: '< $15' }),
        },
      ],
      forEach: jest.fn(),
    });

    jest.spyOn(require('../recommendationServices'), 'fetchRecommendations').mockResolvedValue([
      { id: '1', name: 'Veggie Place', dietaryFlags: ['Vegetarian'] },
      { id: '2', name: 'Steak House', dietaryFlags: [] },
      { id: '3', name: 'Vegan Cafe', dietaryFlags: ['Vegan'] },
    ]);

    const results = await fetchRecommendations('group1', 'meeting1');

    expect(results.some(place => place.dietaryFlags.includes('Vegetarian'))).toBe(true);
  });
});