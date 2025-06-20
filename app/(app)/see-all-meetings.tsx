import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../../services/firebaseConfig';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';

export default function SeeAllMeetingsScreen() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let groupUnsubscribe: (() => void) | null = null;
    let meetingsUnsubscribes: (() => void)[] = [];

    const user = auth.currentUser;
    if (!user) {
      setMeetings([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const groupsRef = collection(db, 'groups');
    const groupsQuery = query(
      groupsRef,
      where('members', 'array-contains', user.uid)
    );
    groupUnsubscribe = onSnapshot(groupsQuery, (groupsSnapshot) => {
      meetingsUnsubscribes.forEach((unsub) => unsub());
      meetingsUnsubscribes = [];

      if (groupsSnapshot.empty) {
        setMeetings([]);
        setLoading(false);
        return;
      }

      groupsSnapshot.forEach((groupDoc) => {
        const groupId = groupDoc.id;
        const groupName = groupDoc.data().name;
        const meetingsRef = collection(db, 'groups', groupId, 'meetings');
        const meetingsQuery = query(meetingsRef, orderBy('date', 'asc'));
        const meetingsUnsub = onSnapshot(meetingsQuery, (meetingsSnapshot) => {
          const now = new Date();
          const groupMeetings = meetingsSnapshot.docs
            .map((doc) => ({
              id: doc.id,
              groupId,
              groupName,
              ...doc.data(),
              date: doc.data().date?.toDate
                ? doc.data().date.toDate()
                : new Date(doc.data().date),
            }))
            .filter((meeting) => meeting.date > now);

          setMeetings((prevMeetings) => {
            const filtered = prevMeetings.filter(
              (m) => m.groupId !== groupId
            );
            return [...filtered, ...groupMeetings].sort(
              (a, b) => a.date - b.date
            );
          });

          setLoading(false);
        });
        meetingsUnsubscribes.push(meetingsUnsub);
      });
    });

    return () => {
      if (groupUnsubscribe) groupUnsubscribe();
      meetingsUnsubscribes.forEach((unsub) => unsub());
    };
  }, []);

  const formatDateTime = (date: Date) =>
    `${date.toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })}  ${date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: 'All Upcoming Meetings',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.replace('/home')}
              style={{ marginLeft: 25 }}
            >
              <Ionicons name="arrow-back" size={24} color="#EA4080" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color="#EA4080" />
        ) : meetings.length > 0 ? (
          meetings.map((m) => (
            <TouchableOpacity
              key={`${m.groupId}_${m.id}`}
              style={styles.meetingBubble}
              onPress={() =>
                router.push({
                  pathname: '/meeting-details/[groupId]/[meetingId]',
                  params: {
                    groupId: m.groupId,
                    meetingId: m.id,
                    from: 'see-all-meetings',
                  },
                })
              }
              activeOpacity={0.85}
            >
              <View style={styles.meetingDetails}>
                <Text style={styles.meetingTitle}>{m.name}</Text>
                <Text style={styles.meetingGroupName}>{m.groupName}</Text>
                <Text style={styles.meetingTimeLocation}>
                  {formatDateTime(m.date)} • {m.location}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#ccc" />
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No upcoming meetings.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f4f8' },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 28,
    color: '#EA4080',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  meetingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  meetingDetails: { flex: 1 },
  meetingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#444',
    marginBottom: 4,
  },
  meetingGroupName: {
    fontSize: 15,
    color: '#EA4080',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  meetingTimeLocation: {
    fontSize: 15,
    color: '#777',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    paddingVertical: 30,
    fontSize: 17,
  },
});