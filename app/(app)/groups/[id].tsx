import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';

import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { GroupData, IconSetType, availableIcons, getIconSetComponent } from '.';
import { auth, db } from '../../../services/firebaseConfig';

export default function GroupDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id;
  const [group, setGroup] = useState<GroupData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [memberDisplayNames, setMemberDisplayNames] = useState<{ [uid: string]: string }>({});

  const handleManageGroupPress = useCallback(() => {
    if (group?.id) {
      router.push({ pathname: '/groups/[id]/manage', params: { id: group.id } });
    }
  }, [group, router]);

  const fetchMemberDisplayNames = useCallback(async (memberUids: string[]) => {
    const names: { [uid: string]: string } = {};
    if (memberUids.length === 0) {
      setMemberDisplayNames({});
      return;
    }

    try {
      const usersRef = collection(db, 'users');
      const userQueries = memberUids.map(uid => getDoc(doc(usersRef, uid)));
      const userDocs = await Promise.all(userQueries);

      userDocs.forEach(userDoc => {
        if (userDoc.exists()) {
          const userData = userDoc.data();
          names[userDoc.id] = userData.username || userData.email || `User ${userDoc.id.substring(0, 4)}...`;
        } else {
          names[userDoc.id] = `Unknown User (${userDoc.id.substring(0, 4)}...)`;
        }
      });
      setMemberDisplayNames(names);
    } catch (error) {
      console.error('Error fetching member display names:', error);
    }
  }, []);

  useEffect(() => {
    if (!id) {
        setIsLoading(false);
        return;
    }
    const fetchGroupDetails = async () => {
      setIsLoading(true);
      try {
        const docRef = doc(db, 'groups', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const fetchedGroup: GroupData = {
            id: docSnap.id,
            name: data.name,
            members: data.members || [],
            iconType: data.iconType || 'vector',
            iconName: data.iconName,
            iconColor: data.iconColor,
            iconSource: data.iconSource,
            ownerId: data.ownerId,
            createdAt: data.createdAt,
            iconSet: getIconSetComponent(data.iconName),
          };
          setGroup(fetchedGroup);
          await fetchMemberDisplayNames(fetchedGroup.members);
        } else {
          console.warn('No such group document!', id);
          router.replace('/groups');
        }
      } catch (error) {
        console.error('Error fetching group details:', error);
        setGroup(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGroupDetails();
  }, [id, fetchMemberDisplayNames, router]);
  
  const [meetings, setMeetings] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    const fetchMeetings = async () => {
      const meetingsRef = collection(db, 'groups', id, 'meetings');
      const snapshot = await getDocs(meetingsRef);
      const meetingsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMeetings(meetingsList);
    };
    fetchMeetings();
  }, [id])

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <ActivityIndicator size="large" color="#E15A7C" />
        <Text style={styles.loadingText}>Loading Group Details...</Text>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Error' }} />
        <Text style={styles.loadingText}>Group not found.</Text>
      </SafeAreaView>
    );
  }
  
  const ActualIconSet = group.iconType === 'vector' && group.iconName ? getIconSetComponent(group.iconName) : Ionicons;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: group.name }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            {group.iconType === 'image' && group.iconSource && (
              <Text style={{ color: '#888', fontSize: 12 }}>Image Icon</Text>
            )}
            {group.iconType === 'vector' && group.iconName && (
              React.createElement(ActualIconSet, { 
                name: group.iconName,
                size: 60,
                color: group.iconColor || '#555',
              })
            )}
          </View>
          <Text style={styles.groupName}>{group.name}</Text>

        {auth.currentUser?.uid && group.members.includes(auth.currentUser.uid) && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleManageGroupPress}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={16} color="#fff" style={{ marginRight: 7 }} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
        </View>

        <View style={styles.detailCard}>
          <Text style={styles.cardTitle}>Members</Text>
          {group.members.length > 0 ? (
            group.members.map((memberUid, index) => (
              <View key={index} style={styles.memberRow}>
                <Ionicons name="person-circle-outline" size={20} color="#777" style={styles.memberIcon} />
                <Text style={styles.memberText}>
                  {memberDisplayNames[memberUid] || `User ${memberUid.substring(0, 4)}...`}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyMembersText}>No members in this group yet.</Text>
          )}
        </View>


        <TouchableOpacity
          style={styles.createMeetingButton}
          onPress={() => router.push({ pathname: `/groups/[id]/create-meeting`, params: { id: group.id } })}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.createMeetingButtonText}>Create New Meeting</Text>
        </TouchableOpacity>

        <View style={styles.detailCard}>
          <Text style={styles.cardTitle}>Meetings</Text>
          {meetings.length === 0 ? (
            <Text style={styles.emptyMembersText}>No meetings yet.</Text>
          ) : (
            meetings.map(meeting => (
              <TouchableOpacity
                key={meeting.id}
                style={styles.meetingItem}
                onPress={() => router.push({ pathname: `/groups/[id]/meetings/[meetingId]`, params: { id: group.id, meetingId: meeting.id } })}
              >
                <View style={styles.meetingRow}>
                  <Ionicons name="time-outline" size={16} color="#777" style={{ marginRight: 6 }} />
                  <Text style={styles.meetingName}>{meeting.name}</Text>
                </View>
                <Text style={styles.meetingMeta}>
                  {new Date(meeting.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}, {' '}
                  {new Date(meeting.date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })} @ {meeting.location}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#888',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  groupName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  detailCard: {
    backgroundColor: '#fff',
    width: '100%',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 5,
  },
  cardText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  memberText: {
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: 16,
    color: '#555',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },

  memberIcon: {
    marginRight: 8,
  },
  emptyMembersText: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#EA4080',
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 14,
    marginTop: 8,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  createMeetingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#4A90E2',
    borderRadius: 16,
    paddingVertical: 7,
    paddingHorizontal: 18,
    marginTop: 10,
    marginBottom: 18,
  },
  createMeetingButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  meetingItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  meetingName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  meetingMeta: {
    color: '#888',
    fontSize: 13,
  },
  meetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  }
});