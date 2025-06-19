import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View, TouchableOpacity, } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../../services/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

export default function MeetingDetailsScreen() {
  const { id: groupId, meetingId } = useLocalSearchParams<{ id: string; meetingId: string }>();
  const router = useRouter();
  const [meeting, setMeeting] = useState<any>(null);
  const [creatorName, setCreatorName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

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

    const fetchMeeting = async () => {
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
      } catch (error) {
        console.error('Error fetching meeting or user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeeting();
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
      <View style={styles.container}>
        <Text style={styles.label}>Meeting Name</Text>
        <Text style={styles.value}>{meeting.name}</Text>

        <Text style={styles.label}>Date & Time</Text>
        <Text style={styles.value}>{formatDateTime(meeting.date)}</Text>

        <Text style={styles.label}>Location</Text>
        <Text style={styles.value}>{meeting.location}</Text>

        <Text style={styles.label}>Created By</Text>
        <Text style={styles.value}>{creatorName}</Text>

        <TouchableOpacity
          onPress={() => router.push({ pathname: `/groups/[id]/meetings/[meetingId]/edit`, params: { id: groupId, meetingId } })}
          style={styles.editMeetingButtonTouchable}
        >
          <LinearGradient
            colors={['#EA4080', '#FFC174']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.gradient}
          >
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text style={styles.editMeetingButtonText}>Edit Meeting</Text>
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
    fontSize: 16,
    marginLeft: 8,
  },
  editMeetingButtonTouchable: {
    marginTop: 30,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },

  gradient: {
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});