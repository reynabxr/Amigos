import { firebaseSignUp } from '../authService';
import { updateUsername } from '../authService';

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  updateProfile: jest.fn(),
  getReactNativePersistence: jest.fn(() => ({})),
  initializeAuth: jest.fn(() => ({
    onAuthStateChanged: jest.fn(),
  })),
}));

jest.mock('firebase/firestore', () => ({
  setDoc: jest.fn(),
  doc: jest.fn(),
  collection: jest.fn(),
  getDocs: jest.fn(),
  where: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(),
  getFirestore: jest.fn(() => ({})),
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

jest.mock('../firebaseConfig', () => ({
  auth: {
    currentUser: { uid: 'mock-user-id', email: 'mock@example.com' },
  },
  db: {},
}));

describe('Integration: Auth + Firestore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // IT-001 passed
  it('Signup creates user in Auth and Firestore', async () => {
    const mockUser = { uid: 'abc123', email: 'test@example.com' };
    require('firebase/auth').createUserWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });
    require('firebase/firestore').setDoc.mockResolvedValueOnce(undefined);
    require('firebase/auth').updateProfile.mockResolvedValueOnce(undefined);
    require('firebase/firestore').getDocs.mockResolvedValueOnce({ empty: true });

    const result = await firebaseSignUp('testuser', 'test@example.com', 'password');

    expect(require('firebase/auth').createUserWithEmailAndPassword).toHaveBeenCalled();
    expect(require('firebase/firestore').setDoc).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.profile).toBeDefined();
  });

  // IT-002 passed
  it('Username update syncs Auth and Firestore', async () => {
    require('firebase/firestore').getDocs.mockResolvedValueOnce({ empty: true, forEach: jest.fn() });
    require('firebase/firestore').setDoc.mockResolvedValueOnce(undefined);
    require('firebase/auth').updateProfile.mockResolvedValueOnce(undefined);

    const result = await updateUsername('mock-user-id', 'newUsername');

    expect(require('firebase/firestore').setDoc).toHaveBeenCalled();
    expect(require('firebase/auth').updateProfile).toHaveBeenCalledWith(expect.anything(), { displayName: 'newUsername' });
    expect(result.success).toBe(true);
    });
});