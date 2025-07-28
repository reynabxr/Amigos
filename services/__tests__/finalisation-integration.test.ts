import { finalizeMeetingLocation } from '../meetingService';
import { getDoc, setDoc } from 'firebase/firestore';

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  setDoc: jest.fn(),
  doc: jest.fn((...args) => args.slice(1).join('/')),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  collection: jest.fn((...args) => args.join('/')),
}));

jest.mock('../firebaseConfig', () => ({
  db: {},
  auth: {
    currentUser: { uid: 'user1', email: 'test@example.com' },
  },
}));

describe('Integration: Dining Location Finalisation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // IT-009 passed
  it('Dining location finalisation updates group and history', async () => {
    const mockSetDoc = require('firebase/firestore').setDoc;
    mockSetDoc.mockResolvedValueOnce(undefined);

    require('firebase/firestore').getDoc.mockImplementation((ref: string) => {
      if (ref.includes('groups/group1/meetings/meeting1')) {
        return Promise.resolve({
          exists: () => true,
          data: () => ({
            eatingConfirmed: true,
            finalPlaceId: 'place123',
          }),
        });
      }
      if (ref.includes('users/user1/history/place123')) {
        return Promise.resolve({
          exists: () => true,
          data: () => ({
            placeId: 'place123',
            visitedAt: expect.any(Number),
          }),
        });
      }
      return Promise.resolve({ exists: () => false, data: () => ({}) });
    });

    await finalizeMeetingLocation({
      groupId: 'group1',
      meetingId: 'meeting1',
      placeId: 'place123',
    });

    expect(mockSetDoc).toHaveBeenCalledWith(
      'groups/group1/meetings/meeting1',
      expect.objectContaining({
        eatingConfirmed: true,
        finalPlaceId: 'place123',
      }),
      expect.anything()
    );

    expect(mockSetDoc).toHaveBeenCalledWith(
      'users/user1/history/place123',
      expect.objectContaining({
        placeId: 'place123',
        visitedAt: expect.any(Number),
      }),
      expect.anything()
    );
  });
});