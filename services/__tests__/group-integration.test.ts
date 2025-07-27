import { createGroup, CreateGroupParams } from '../groupService';

jest.mock('firebase/firestore', () => ({
  setDoc: jest.fn(),
  addDoc: jest.fn(),
  collection: jest.fn(),
  getDoc: jest.fn(),
  doc: jest.fn(),
}));

jest.mock('../firebaseConfig', () => ({
  auth: {
    currentUser: { uid: 'user123', email: 'test@example.com' },
  },
  db: {},
}));

describe('Integration: Group Creation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // IT-004 passed
  it('Group creation adds user as member', async () => {
    const mockGroupId = 'group456';
    require('firebase/firestore').addDoc.mockResolvedValueOnce({ id: mockGroupId });
    require('firebase/firestore').setDoc.mockResolvedValueOnce(undefined);

    require('firebase/firestore').getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        members: ['user123'],
      }),
    });

    const groupData = { name: 'Test Group', members: ['user123'] };
    const params: CreateGroupParams = {
        groupName: 'Test Group',
        selectedMemberUids: ['user456', 'user789'],
        selectedIcon: { name: 'people-outline', color: '#4A90E2' },
    };
    await createGroup(params);

    expect(require('firebase/firestore').addDoc).toHaveBeenCalled();
    const callArgs = require('firebase/firestore').addDoc.mock.calls[0][1];
    expect(callArgs.members).toContain('user123');

    const groupDoc = await require('firebase/firestore').getDoc();
    expect(groupDoc.data().members).toContain('user123');
  });
});