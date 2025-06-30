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

import { firebaseSignUp, updateUsername } from '../authService';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { setDoc, getDocs } from 'firebase/firestore';

// IT-001 passed
describe('Integration: firebaseSignUp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates user in Auth and profile in Firestore', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({ empty: true });

    (createUserWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
      user: { uid: '123', email: 'test@example.com' },
    });

    (updateProfile as jest.Mock).mockResolvedValueOnce(undefined);

    (setDoc as jest.Mock).mockResolvedValueOnce(undefined);

    const result = await firebaseSignUp('testuser', 'test@example.com', 'password');

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'test@example.com', 'password');
    expect(updateProfile).toHaveBeenCalledWith(expect.anything(), { displayName: 'testuser' });
    expect(setDoc).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.profile).toBeDefined();
  });
});

// IT-002 passed
const { __setMockUser } = require('../firebaseConfig');

describe('Integration: updateUsername', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates username in both Auth and Firestore', async () => {
    __setMockUser({
      uid: 'mock-user-id',
      email: 'mock@example.com',
      updateProfile: jest.fn(),
    });

    (getDocs as jest.Mock).mockResolvedValueOnce({ empty: true, forEach: jest.fn() });
    (setDoc as jest.Mock).mockResolvedValueOnce(undefined);
    (updateProfile as jest.Mock).mockResolvedValueOnce(undefined);

    const result = await updateUsername('mock-user-id', 'newUsername');

    expect(setDoc).toHaveBeenCalled();
    expect(updateProfile).toHaveBeenCalledWith(expect.anything(), { displayName: 'newUsername' });
    expect(result.success).toBe(true);
  });
});