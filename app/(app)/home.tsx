import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where
} from 'firebase/firestore';
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
import { StarRating } from '../../components/StarRating';
import { auth, db } from '../../services/firebaseConfig';

const cuisineIconNames: Record<string, string> = {
  Japanese: 'food-croissant',        
  Chinese: 'noodles',
  Western: 'hamburger',
  Indian: 'food-variant',
  Malay: 'rice',
  Korean: 'food',
  Thai: 'noodles',
  Vietnamese: 'noodles',
  Mediterranean: 'food-variant',
};

const categoryIconNames: Record<string, string> = {
  'Ramen Restaurant': 'noodles',
  'Noodle Restaurant': 'noodles',
  'Japanese Restaurant': 'noodles',
  'French Restaurant': 'eiffel-tower',
  'Italian Restaurant': 'pasta',
  'Seafood Restaurant': 'fish',
  'Fast Food Restaurant': 'hamburger',
  'Café': 'coffee',
  'Coffee Shop': 'coffee',
  'Salad Restaurant': 'food-apple',
  'Pizza Place': 'pizza',
  'Bakery': 'bread-slice',
  'Steakhouse': 'food-steak',
  'Bar': 'glass-cocktail',
  'Soup Spot': 'food-apple',
};

const SectionCard = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <View style={styles.sectionCard}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>
);

const PlaceItem = ({ item, onPress }: { item: any, onPress: () => void }) => {
  // If an image URL exists, we show the image.
  if (item.image) {
    return (
      <TouchableOpacity style={styles.placeItem} onPress={onPress}>
        <Image source={{ uri: item.image }} style={styles.placeImage} />
        <View style={styles.placeDetails}>
          <Text style={styles.placeName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.placeInfo}>
            Visited with <Text style={styles.groupNameHighlight}>{item.groupName}</Text> on {item.visitedAt ? new Date(item.visitedAt).toLocaleDateString() : '—'}
          </Text>
          <StarRating rating={item.rating || 0} size={16} />
        </View>
        <Ionicons name="chevron-forward" size={24} color="#ccc" />
      </TouchableOpacity>
    );
  }

  const iconName =
    categoryIconNames[item.category] ||
    (item.cuisines && item.cuisines.length > 0 && cuisineIconNames[item.cuisines[0]]) ||
    'silverware-fork-knife';

  return (
    <TouchableOpacity style={styles.placeItem} onPress={onPress}>
      <View style={styles.placeIconContainer}>
        <MaterialCommunityIcons name={iconName as any} size={36} color="#EA4080" />
      </View>
      <View style={styles.placeDetails}>
        <Text style={styles.placeName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.placeInfo}>
          Visited with <Text style={styles.groupNameHighlight}>{item.groupName}</Text> on {item.visitedAt ? new Date(item.visitedAt).toLocaleDateString() : '—'}
        </Text>
        <StarRating rating={item.rating || 0} size={16} />
      </View>
      <Ionicons name="chevron-forward" size={24} color="#ccc" />
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const [placesEaten, setPlacesEaten] = useState<any[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
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
      });

      // this handles the case where a user is in groups, but none have upcoming meetings.
      if (groupsSnapshot.docs.length > 0 && meetingsUnsubscribes.length === 0) {
        setLoadingMeetings(false);
        setMeetings([]);
      } else if (groupsSnapshot.docs.length === 0) {
        setLoadingMeetings(false);
        setMeetings([]);
      }
    });

    return () => {
      if (groupUnsubscribe) groupUnsubscribe();
      meetingsUnsubscribes.forEach(unsub => unsub());
    };
  }, []);

useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setPlacesEaten([]);
      setLoadingPlaces(false);
      return;
    }

    setLoadingPlaces(true);
    let allUnsubscribes: (() => void)[] = [];
    const ratingsMap = new Map<string, number>();

    const triggerPlaceFetch = () => {
        const groupsQuery = query(collection(db, 'groups'), where('members', 'array-contains', user.uid));
        
        getDocs(groupsQuery).then(groupsSnapshot => {
            if (groupsSnapshot.empty) {
                setPlacesEaten([]);
                setLoadingPlaces(false);
                return;
            }

            let allHistoryItems: any[] = [];
            const promises: Promise<any>[] = [];

            groupsSnapshot.forEach(groupDoc => {
                const meetingsQuery = query(collection(db, 'groups', groupDoc.id, 'meetings'), where('eatingConfirmed', '==', true));
                
                const promise = getDocs(meetingsQuery).then(meetingsSnapshot => {
                    const placePromises: Promise<any>[] = [];
                    meetingsSnapshot.forEach(meetingDoc => {
                        const meetingData = meetingDoc.data();
                        const finalPlaceId = meetingData.finalPlaceId;
                        if (finalPlaceId && typeof meetingData.date === 'number') { 
                            const placeDocRef = doc(db, 'groups', groupDoc.id, 'meetings', meetingDoc.id, 'recommendations', finalPlaceId);
                            placePromises.push(getDoc(placeDocRef).then(placeDoc => {
                                if (placeDoc.exists()) {
                                    allHistoryItems.push({
                                        id: placeDoc.id,
                                        ...placeDoc.data(),
                                        visitedAt: meetingData.date, 
                                        rating: ratingsMap.get(finalPlaceId) || 0,
                                        groupName: groupDoc.data().name,
                                    });
                                }
                            }));
                        }
                    });
                    return Promise.all(placePromises);
                });
                promises.push(promise);
            });

            Promise.all(promises).then(() => {
                allHistoryItems.sort((a, b) => (b.visitedAt || 0) - (a.visitedAt || 0));
                
                setPlacesEaten(allHistoryItems);
                setLoadingPlaces(false);
            });
        });
    };

    const ratingsQuery = query(collection(db, 'users', user.uid, 'ratings'));
    const ratingsUnsub = onSnapshot(ratingsQuery, (snapshot) => {
        snapshot.forEach(doc => {
            ratingsMap.set(doc.data().placeId, doc.data().rating);
        });
        triggerPlaceFetch();
    });
    allUnsubscribes.push(ratingsUnsub);

    const groupsQuery = query(collection(db, 'groups'), where('members', 'array-contains', user.uid));
    const groupsUnsub = onSnapshot(groupsQuery, () => {
        triggerPlaceFetch();
    });
    allUnsubscribes.push(groupsUnsub);

    return () => allUnsubscribes.forEach(unsub => unsub());
  }, []);

  const formatDateTime = (ts: Date) => {
    if (!ts || !(ts instanceof Date)) return '';
    return `${ts.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}  ${ts.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })}`;
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
        <SectionCard title="Upcoming Meetings">
          {loadingMeetings ? ( <ActivityIndicator /> ) : meetings.length > 0 ? (
            meetings.slice(0, 3).map(m => <MeetingItem key={`${m.groupId}_${m.id}`} item={m} />)
          ) : ( <Text style={styles.emptyText}>No upcoming meetings.</Text> )}
          <TouchableOpacity style={styles.seeAllButton} onPress={() => router.push('/see-all-meetings')}>
            <Text style={styles.seeAllText}>See All Meetings</Text>
          </TouchableOpacity>
        </SectionCard>
        <SectionCard title="Places I've Eaten At">
          {loadingPlaces ? ( <ActivityIndicator /> ) : placesEaten.length > 0 ? (
            placesEaten.slice(0, 3).map(item => (
              <PlaceItem
                key={item.id}
                item={item}
                onPress={() => router.push({ pathname: "/places/[placeId]", params: { placeId: item.id, placeData: JSON.stringify(item) } })}
              />
            ))
          ) : ( <Text style={styles.emptyText}>No places recorded yet.</Text> )}
          <TouchableOpacity style={styles.seeAllButton} onPress={() => router.push('/see-all-places')}>
            <Text style={styles.seeAllText}>See All Places</Text>
          </TouchableOpacity>
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f4f8' },
  container: { padding: 15, paddingBottom: 30 },
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
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  meetingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  meetingDetails: { flex: 1 },
  meetingTitle: { fontSize: 16, fontWeight: '600', color: '#444' },
  meetingGroupName: { fontSize: 13, color: '#EA4080', fontWeight: 'bold', marginTop: 2 },
  meetingTimeLocation: { fontSize: 14, color: '#777', marginTop: 2 },
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
    backgroundColor: '#e0e0e0',
  },
  placeIconContainer: {
    width: 80,
    height: 60,
    borderRadius: 6,
    marginRight: 15,
    backgroundColor: '#fff0f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  placeDetails: { flex: 1 },
  placeName: { fontSize: 16, fontWeight: '600', color: '#444' },
  placeInfo: { fontSize: 14, color: '#777', marginTop: 2 },
  groupNameHighlight: {
    fontWeight: '600',
    color: '#EA4080',
  },
  emptyText: { textAlign: 'center', color: '#888', paddingVertical: 20, fontSize: 15 },
  seeAllButton: { marginTop: 15, alignItems: 'flex-end' },
  seeAllText: { fontSize: 14, color: '#EA4080', fontWeight: '600' },
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  
});