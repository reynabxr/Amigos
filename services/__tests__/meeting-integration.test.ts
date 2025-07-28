import { createMeeting, CreateMeetingParams } from '../meetingService';

jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn(() => 'mock-collection-ref'),
  getDocs: jest.fn(),
}));

jest.mock('../firebaseConfig', () => ({
  db: {},
}));

describe('Integration: Meeting Creation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // IT-005 passed
  it('Meeting creation links to correct group', async () => {
    const mockAddDoc = require('firebase/firestore').addDoc;
    mockAddDoc.mockResolvedValueOnce({ id: 'meeting123' });

    const params: CreateMeetingParams = {
      groupId: 'group456',
      name: 'Lunch Meeting',
      location: 'Cafe',
      lat: 1.3,
      lng: 103.8,
      date: new Date(),
    };

    await createMeeting(params);

    expect(require('firebase/firestore').addDoc).toHaveBeenCalled();

    // check that the meeting was added to the correct group's meetings subcollection
    const [collectionCall, meetingData] = mockAddDoc.mock.calls[0];
    expect(collectionCall).toBeDefined();
    expect(meetingData.name).toBe('Lunch Meeting');

    expect(require('firebase/firestore').collection).toHaveBeenCalledWith(
      expect.anything(),
      'groups',
      'group456',
      'meetings'
    );
  });
});