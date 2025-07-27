import { recordVote, getConsensus } from '../recommendationServices';

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

describe('Integration: Swiping/Voting and Consensus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // IT-006 passed
  it('Swiping/voting updates group consensus', async () => {
    require('firebase/firestore').getDoc.mockImplementation((ref: string | string[]) => {
      if (typeof ref === 'string' && ref.includes('groups/')) {
        return Promise.resolve({
          data: () => ({ members: ['user1', 'user2'] }),
        });
      }
      return Promise.resolve({ data: () => ({}) });
    });

    require('firebase/firestore').getDocs.mockResolvedValueOnce({
      docs: [
        { data: () => ({ restaurantId: 'rest1', vote: true, memberId: 'user1' }) },
        { data: () => ({ restaurantId: 'rest1', vote: true, memberId: 'user2' }) },
        { data: () => ({ restaurantId: 'rest2', vote: true, memberId: 'user2' }) },
        { data: () => ({ restaurantId: 'rest2', vote: false, memberId: 'user1' }) },
      ],
    });

    const consensus = await getConsensus('group1', 'meeting1');
    expect(consensus.status).toBe('chosen');
    expect(consensus.restaurantIds).toContain('rest1');
  });

  it('returns top-voted if no unanimous choice', async () => {
    require('firebase/firestore').getDoc.mockImplementation((ref: string | string[]) => {
      if (typeof ref === 'string' && ref.includes('groups/')) {
        return Promise.resolve({
          data: () => ({ members: ['user1', 'user2'] }),
        });
      }
      return Promise.resolve({ data: () => ({}) });
    });

    require('firebase/firestore').getDocs.mockResolvedValueOnce({
      docs: [
        { data: () => ({ restaurantId: 'rest1', vote: true, memberId: 'user1' }) },
        { data: () => ({ restaurantId: 'rest1', vote: false, memberId: 'user2' }) },
        { data: () => ({ restaurantId: 'rest2', vote: true, memberId: 'user2' }) },
        { data: () => ({ restaurantId: 'rest2', vote: false, memberId: 'user1' }) },
      ],
    });

    const consensus = await getConsensus('group1', 'meeting1');

    expect(consensus.status).toBe('top');
    expect(consensus.restaurantIds).toEqual(expect.arrayContaining(['rest1', 'rest2']));
  });
});