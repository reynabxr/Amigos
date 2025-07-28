import { addDoc, collection, setDoc, doc } from 'firebase/firestore';
import { db, auth } from './firebaseConfig';

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

export interface FinalizeMeetingLocationParams {
  groupId: string;
  meetingId: string;
  placeId: string;
}

export async function finalizeMeetingLocation({
  groupId,
  meetingId,
  placeId,
}: FinalizeMeetingLocationParams) {
  await setDoc(
    doc(db, 'groups', groupId, 'meetings', meetingId),
    {
      eatingConfirmed: true,
      finalPlaceId: placeId,
    },
    { merge: true }
  );

  if (auth.currentUser) {
    await setDoc(
      doc(db, 'users', auth.currentUser.uid, 'history', placeId),
      {
        placeId,
        visitedAt: Date.now(),
      },
      { merge: true }
    );
  }
}