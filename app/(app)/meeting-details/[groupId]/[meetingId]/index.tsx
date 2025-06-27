import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, onSnapshot } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../../../../services/firebaseConfig';

export default function MeetingDetailsScreen() {
  const { groupId, meetingId, from } = useLocalSearchParams<{
    groupId: string;
    meetingId: string;
    from?: string;
  }>();
  const router = useRouter();
  const navigation = useNavigation();
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

  useFocusEffect(
    useCallback(() => {
      const beforeRemove = navigation.addListener('beforeRemove', (e) => {
        e.preventDefault();
        router.replace('/home');
      });

      return () => {
        beforeRemove(); 
      };
    }, [router, navigation])
  );

  useEffect(() => {
    if (!groupId || !meetingId) return;

    setIsLoading(true);

    const meetingDocRef = doc(db, 'groups', groupId, 'meetings', meetingId);
    const unsubscribe = onSnapshot(meetingDocRef, async (meetingSnap) => {
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

        const names: { [uid: string]: string } = {};
        const userDocs = await Promise.all(
          members.map((uid: string) => getDoc(doc(db, 'users', uid)))
        );
        userDocs.forEach(docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            names[docSnap.id] = data.username || data.email || `User ${docSnap.id.substring(0, 4)}...`;
          } else {
            names[docSnap.id] = `Unknown User (${docSnap.id.substring(0, 4)}...)`;
          }
        });
        setMemberNames(names);
      }

      const prefsRef = collection(db, 'groups', groupId, 'meetings', meetingId, 'preferences');
      const prefsSnapshot = await getDocs(prefsRef);
      const submittedSet = new Set<string>();
      prefsSnapshot.docs.forEach(doc => {
        submittedSet.add(doc.id);
      });
      setPreferencesSubmitted(submittedSet);

      setIsLoading(false);
    });

    return () => unsubscribe();
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
      <Stack.Screen
            options={{
                title: meeting.name,
                headerLeft: () => (
                <TouchableOpacity
                    onPress={() => {
                    if (from === 'home') {
                        router.replace('/home');
                    } else if (from === 'group') {
                        router.replace({
                        pathname: '/groups/[id]',
                        params: { id: groupId },
                        });
                      } else if (from === 'see-all-meetings') {
                        router.replace('/see-all-meetings');
                    } else {
                        router.back();
                    }
                    }}
                    style={{ marginLeft: 10 }}
                >
                    <Ionicons name="arrow-back" size={24} color="#EA4080" />
                </TouchableOpacity>
                ),
            }}
        />

      <TouchableOpacity
        onPress={() =>
          router.push({ pathname: "/meeting-edit/[groupId]/[meetingId]", params: { groupId, meetingId } })
          
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
            router.push({ pathname: "/meeting-preferences/[groupId]/[meetingId]", params: { groupId, meetingId, from } })
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
        <TouchableOpacity
          style={styles.preferenceButton}   
          onPress={() =>
            router.push({
              pathname: "/meeting-details/[groupId]/[meetingId]/recommendations" as any,
              params: { groupId, meetingId },
            })
          }
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#00C6FF', '#0072FF']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.gradient}
          >
            <Ionicons name="restaurant-outline" size={20} color="#fff" />
            <Text style={styles.preferenceButtonText}>
              Pick Restaurant
            </Text>
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