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

import { isUsernameTaken, updateUsername, firebaseSignUp, firebaseSignIn } from '../authService';
import { setDoc, getDocs, getDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';

describe('isUsernameTaken', () => {
  // UT-002 passed
  it('returns true if username exists', async () => {
    (getDocs as any).mockResolvedValueOnce({ empty: false });
    const result = await isUsernameTaken('existingUser');
    expect(result).toBe(true);
  });
  
  // UT-003 passed
  it('returns false if username does not exist', async () => {
    (getDocs as any).mockResolvedValueOnce({ empty: true });
    const result = await isUsernameTaken('newUser');
    expect(result).toBe(false);
  });
});

// UT-004 passed
const { __setMockUser } = require('../firebaseConfig');

describe('updateUsername', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates username in Firestore and Auth', async () => {
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

// UT-005 passed
describe('firebaseSignUp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates user and profile', async () => {
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

// UT-006 passed
describe('firebaseSignIn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs in user and fetches profile', async () => {
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
      user: { uid: '123', email: 'test@example.com' },
    });

    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ username: 'testuser', email: 'test@example.com' }),
    });

    const result = await firebaseSignIn('test@example.com', 'password');

    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'test@example.com', 'password');
    expect(getDoc).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.profile).toBeDefined();
    expect(result.profile?.username).toBe('testuser');
  });
});