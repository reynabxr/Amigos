import { addDoc, collection } from 'firebase/firestore';
import { db } from './firebaseConfig';

export interface CreateMeetingParams {
  groupId: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  date: Date;
}

export async function createMeeting({
  groupId,
  name,
  location,
  lat,
  lng,
  date,
}: CreateMeetingParams) {
  const meetingData = {
    name,
    location,
    lat,
    lng,
    date: date.getTime(),
    createdAt: Date.now(),
  };
  return addDoc(collection(db, 'groups', groupId, 'meetings'), meetingData);
}