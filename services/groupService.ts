import { addDoc, collection } from 'firebase/firestore';
import { db, auth } from './firebaseConfig';

export interface CreateGroupParams {
  groupName: string;
  selectedMemberUids: string[];
  selectedIcon: { name: string; color: string };
}

export async function createGroup({ groupName, selectedMemberUids, selectedIcon }: CreateGroupParams) {
  const user = auth.currentUser;
  if (!user) throw new Error('No user');

  const finalMemberUids: string[] = [...new Set([user.uid, ...selectedMemberUids])];

  const newGroupData = {
    name: groupName.trim(),
    members: finalMemberUids,
    iconType: 'vector',
    iconName: selectedIcon.name,
    iconColor: selectedIcon.color,
    ownerId: user.uid,
    createdAt: Date.now(),
  };

  return addDoc(collection(db, 'groups'), newGroupData);
}