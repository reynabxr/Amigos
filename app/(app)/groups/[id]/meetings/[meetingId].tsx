import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View, TouchableOpacity, } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../../../../../services/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

export default function MeetingDetailsScreen() {
  const { id: groupId, meetingId } = useLocalSearchParams<{ id: string; meetingId: string }>();
  const router = useRouter();
  const [meeting, setMeeting] = useState<any>(null);
  const [creatorName, setCreatorName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [preferencesSubmitted, setPreferencesSubmitted] = useState<Set<string>>(new Set());
  const [memberNames, setMemberNames] = useState<{ [uid: string]: string }>({});

  const formatDateTime = (timestamp: number) => {
    const dateObj = new Date(timestamp);
    const dateStr = dateObj.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = dateObj.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).replace(' ', '');
    return `${dateStr}, ${timeStr}`;
  };

  useEffect(() => {
    if (!groupId || !meetingId) return;

    const fetchUsernames = async (uids: string[]) => {
      const names: { [uid: string]: string } = {};
      try {
        const userDocs = await Promise.all(
          uids.map(uid => getDoc(doc(db, 'users', uid)))
        );
        userDocs.forEach(docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            names[docSnap.id] = data.username || data.email || `User ${docSnap.id.substring(0, 4)}...`;
          } else {
            names[docSnap.id] = `Unknown User (${docSnap.id.substring(0, 4)}...)`;
          }
        });
      } catch (error) {
        console.error('Error fetching usernames:', error);
      }
      return names;
    };

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const meetingDocRef = doc(db, 'groups', groupId, 'meetings', meetingId);
        const meetingSnap = await getDoc(meetingDocRef);
        if (!meetingSnap.exists()) {
          setMeeting(null);
          setIsLoading(false);
          return;
        }
        const meetingData = meetingSnap.data();
        setMeeting(meetingData);

        if (meetingData.createdBy) {
          const userDocRef = doc(db, 'users', meetingData.createdBy);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setCreatorName(userData.username || userData.email || 'Unknown User');
          } else {
            setCreatorName('Unknown User');
          }
        }
        const groupDocRef = doc(db, 'groups', groupId);
        const groupSnap = await getDoc(groupDocRef);
        if (groupSnap.exists()) {
          const groupData = groupSnap.data();
          const members = groupData.members || [];
          setGroupMembers(members);

          const fetchedNames = await fetchUsernames(members);
          setMemberNames(fetchedNames);
        }

        const prefsRef = collection(db, 'groups', groupId, 'meetings', meetingId, 'preferences');
        const prefsSnapshot = await getDocs(prefsRef);
        const submittedSet = new Set<string>();
        prefsSnapshot.docs.forEach(doc => {
          console.log('Fetched preference doc ID:', doc.id);
          submittedSet.add(doc.id);
        });
        setPreferencesSubmitted(submittedSet);

      } catch (error) {
        console.error('Error fetching meeting or user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [groupId, meetingId]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color="#EA4080" />
      </SafeAreaView>
    );
  }

  if (!meeting) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.errorText}>Meeting not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: meeting.name }} />

      <TouchableOpacity
        onPress={() =>
          router.push({ pathname: `/groups/[id]/meetings/[meetingId]/edit`, params: { id: groupId, meetingId } })
        }
        style={styles.editMeetingButtonTouchable}
      >
        <Ionicons name="create-outline" size={16} color="#fff" />
        <Text style={styles.editMeetingButtonText}>Edit</Text>
      </TouchableOpacity>

      <View style={styles.container}>
        <Text style={styles.label}>Meeting Name</Text>
        <Text style={styles.value}>{meeting.name}</Text>

        <Text style={styles.label}>Date & Time</Text>
        <Text style={styles.value}>{formatDateTime(meeting.date)}</Text>

        <Text style={styles.label}>Location</Text>
        <Text style={styles.value}>{meeting.location}</Text>

        <Text style={styles.label}>Created By</Text>
        <Text style={styles.value}>{creatorName}</Text>

        <Text style={[styles.label, { marginTop: 30, marginBottom: 10 }]}>Members' Preferences</Text>
        {groupMembers.length === 0 ? (
          <Text style={styles.emptyMembersText}>No members found.</Text>
        ) : (
          groupMembers.map((memberUid) => (
            <View key={memberUid} style={styles.memberRow}>
              {preferencesSubmitted.has(memberUid) ? (
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              ) : (
                <Ionicons name="ellipse-outline" size={20} color="#ccc" />
              )}
              <Text style={styles.memberText}>{memberNames[memberUid] || memberUid}</Text>
            </View>
          ))
        )}

        <TouchableOpacity
          style={styles.preferenceButton}
          onPress={() =>
            router.push({
              pathname: `/groups/[id]/meetings/[meetingId]/preferences`,
              params: { id: groupId, meetingId },
            })
          }
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#EA4080', '#FFC174']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.gradient}
          >
            <Ionicons name="fast-food-outline" size={20} color="#fff" />
            <Text style={styles.preferenceButtonText}>Set Preferences</Text>
          </LinearGradient>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 24,
  },
  label: {
    fontWeight: '600',
    marginTop: 24,
    fontSize: 16,
    color: '#222',
  },
  value: {
    fontSize: 18,
    color: '#444',
    marginTop: 6,
    backgroundColor: '#f7f7f7',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  editMeetingButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  editMeetingButtonTouchable: {
    position: 'absolute',
    top: 15,
    right: 20,
    backgroundColor: '#EA4080',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    zIndex: 10,
  },
  gradient: {
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  preferenceButton: {
    marginTop: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  preferenceButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  memberText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#555',
    flex: 1,
  },
  emptyMembersText: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 6,
  },
});