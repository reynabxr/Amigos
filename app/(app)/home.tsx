import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, limit, onSnapshot, orderBy, query, where, } from 'firebase/firestore';
import React, { useEffect, useState, } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth, db } from '../../services/firebaseConfig';

const SectionCard = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <View style={styles.sectionCard}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const PlaceItem = ({ item, onPress }: { item: any, onPress: () => void }) => (
  <TouchableOpacity style={styles.placeItem} onPress={onPress}>
    <Image source={{ uri: item.image || 'https://via.placeholder.com/100x80.png?text=Food' }} style={styles.placeImage} />
    <View style={styles.placeDetails}>
      <Text style={styles.placeName}>{item.name}</Text>
      <Text style={styles.placeInfo}>
        Last visited: {item.lastVisited ? new Date(item.lastVisited).toLocaleDateString() : '—'}
      </Text>
      <Text style={styles.placeInfo}>
        Rating: {item.rating ? '⭐'.repeat(item.rating) : 'Not rated'}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={24} color="#ccc" />
  </TouchableOpacity>
);


export default function HomeScreen() {
  const [placesEaten, setPlacesEaten] = useState<any[]>([]);
const [loadingPlaces, setLoadingPlaces] = useState(true);

useEffect(() => {
  const user = auth.currentUser;
  if (!user) {
    setPlacesEaten([]);
    setLoadingPlaces(false);
    return;
  }
  setLoadingPlaces(true);
  const placesRef = collection(db, 'users', user.uid, 'visitedPlaces');
  const q = query(placesRef, orderBy('visitedAt', 'desc'), limit(5));
  const unsub = onSnapshot(q, (snap) => {
    setPlacesEaten(
      snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastVisited: doc.data().visitedAt?.toDate
          ? doc.data().visitedAt.toDate()
          : new Date(doc.data().visitedAt),
      }))
    );
    setLoadingPlaces(false);
  });
  return () => unsub();
}, []);

  const [meetings, setMeetings] = useState<any[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let groupUnsubscribe: (() => void) | null = null;
    let meetingsUnsubscribes: (() => void)[] = [];

    const user = auth.currentUser;
    if (!user) {
      setMeetings([]);
      setLoadingMeetings(false);
      return;
    }

    setLoadingMeetings(true);

    const groupsRef = collection(db, 'groups');
    const groupsQuery = query(groupsRef, where('members', 'array-contains', user.uid));
    groupUnsubscribe = onSnapshot(groupsQuery, (groupsSnapshot) => {

      meetingsUnsubscribes.forEach(unsub => unsub());
      meetingsUnsubscribes = [];

      if (groupsSnapshot.empty) {
        setMeetings([]);
        setLoadingMeetings(false);
        return;
      }

      const allMeetings: any[] = [];
      let groupsProcessed = 0;

      groupsSnapshot.forEach(groupDoc => {
        const groupId = groupDoc.id;
        const meetingsRef = collection(db, 'groups', groupId, 'meetings');
        const meetingsQuery = query(meetingsRef, orderBy('date', 'desc'));

        const meetingsUnsub = onSnapshot(meetingsQuery, (meetingsSnapshot) => {
          const now = new Date();
          const groupMeetings = meetingsSnapshot.docs.map(doc => ({
            id: doc.id,
            groupId,
            groupName: groupDoc.data().name,
            ...doc.data(),
            date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date),
          }))
          .filter(meeting => meeting.date > now);

          setMeetings(prevMeetings => {
            const filtered = prevMeetings.filter(m => m.groupId !== groupId);
            return [...filtered, ...groupMeetings].sort((a, b) => a.date - b.date).slice(0, 3);
          });

          setLoadingMeetings(false);
        });

        meetingsUnsubscribes.push(meetingsUnsub);
        groupsProcessed++;
      });

      if (groupsProcessed === 0) {
        setMeetings([]);
        setLoadingMeetings(false);
      }
    });

    return () => {
      if (groupUnsubscribe) groupUnsubscribe();
      meetingsUnsubscribes.forEach(unsub => unsub());
    };
  }, []);

  const formatDateTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}  ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  };

  const MeetingItem = ({ item }: any) => (
    <TouchableOpacity style={styles.meetingItem}
      onPress={() =>
          router.replace({
            pathname: '/meeting-details/[groupId]/[meetingId]',
            params: { groupId: item.groupId, meetingId: item.id, from: 'home'},
          })
      }
    >
      <View style={styles.meetingDetails}>
        <Text style={styles.meetingTitle}>{item.name}</Text>
        <Text style={styles.meetingGroupName}>{item.groupName}</Text>
        <Text style={styles.meetingTimeLocation}>
          {formatDateTime(item.date)} • {item.location}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Upcoming Meetings Section */}
        <SectionCard title="Upcoming Meetings">
          {loadingMeetings ? (
            <ActivityIndicator size="large" color="#EA4080" />
          ) : meetings.length > 0 ? (
            meetings.map(m => <MeetingItem key={`${m.groupId}_${m.id}`} item={m} />)
          ) : (
            <Text style={styles.emptyText}>No upcoming meetings.</Text>
          )}
          <TouchableOpacity 
            style={styles.seeAllButton} 
            onPress={() => router.push('/see-all-meetings')}>
            <Text style={styles.seeAllText}>See All Meetings</Text>
          </TouchableOpacity>
        </SectionCard>

        {/* Places Eaten Section */}
        <SectionCard title="Places I've Eaten At">
  {loadingPlaces ? (
    <ActivityIndicator size="large" color="#EA4080" />
  ) : placesEaten.length > 0 ? (
    placesEaten.map(item => (
      <PlaceItem
        key={item.id}
        item={item}
        onPress={() => router.push({ pathname: '/places/[placeId]' as any, params: { placeId: item.id } })}
      />
    ))
  ) : (
    <Text style={styles.emptyText}>No places recorded yet.</Text>
  )}
  <TouchableOpacity style={styles.seeAllButton} onPress={() => router.push('/see-all-places' as any)}>
    <Text style={styles.seeAllText}>See All Places</Text>
  </TouchableOpacity>
</SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f4f8',
  },
  container: {
    padding: 15,
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  meetingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  meetingDetails: {
    flex: 1,
  },
  meetingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
  },
  meetingGroupName: {
    fontSize: 13,
    color: '#EA4080',
    fontWeight: 'bold',
    marginTop: 2,
  },
  meetingTimeLocation: {
    fontSize: 14,
    color: '#777',
    marginTop: 2,
  },
  meetingAttendees: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },
  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  placeImage: {
    width: 80,
    height: 60,
    borderRadius: 6,
    marginRight: 15,
  },
  placeDetails: {
    flex: 1,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
  },
  placeInfo: {
    fontSize: 14,
    color: '#777',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    paddingVertical: 20,
    fontSize: 15,
  },
  seeAllButton: {
    marginTop: 15,
    alignItems: 'flex-end',
  },
  seeAllText: {
    fontSize: 14,
    color: '#EA4080', 
    fontWeight: '600',
  },
});
