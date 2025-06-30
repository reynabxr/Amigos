jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  updateProfile: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  getReactNativePersistence: jest.fn(),
  initializeAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  doc: jest.fn(),
  collection: jest.fn(),
  where: jest.fn(),
  query: jest.fn(),
  getFirestore: jest.fn(() => ({})),
  serverTimestamp: jest.fn(),
}));

jest.mock('../firebaseConfig', () => {
  let _mockUser = {
    uid: 'mock-uid',
    email: 'mockuser@example.com',
    updateProfile: jest.fn(),
    sendEmailVerification: jest.fn(),
    reload: jest.fn(),
  };
  return {
    app: {},
    db: {},
    __setMockUser: (user: any) => { _mockUser = user; },
    get auth() {
      return {
        get currentUser() {
          return _mockUser;
        }
      };
    }
  };
});

import { mapFoursquarePriceToBudget } from '../recommendationServices';

// UT-001 passed
describe('mapFoursquarePriceToBudget', () => {
  it('returns correct budget string for each price level', () => {
    expect(mapFoursquarePriceToBudget(1)).toBe('< $15');
    expect(mapFoursquarePriceToBudget(2)).toBe('$15 - $30');
    expect(mapFoursquarePriceToBudget(3)).toBe('$30 - $50');
    expect(mapFoursquarePriceToBudget(4)).toBe('> $50');
    expect(mapFoursquarePriceToBudget(undefined)).toBe('');
    expect(mapFoursquarePriceToBudget(0)).toBe('');
  });
});