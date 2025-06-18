import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../../services/firebaseConfig';

export default function MeetingDetailsScreen() {
  const { id: groupId, meetingId } = useLocalSearchParams<{ id: string; meetingId: string }>();
  const [meeting, setMeeting] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!groupId || !meetingId) return;
    const fetchMeeting = async () => {
      setIsLoading(true);
      const docRef = doc(db, 'groups', groupId, 'meetings', meetingId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setMeeting(docSnap.data());
      setIsLoading(false);
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
        <Text style={styles.value}>{new Date(meeting.date).toLocaleString()}</Text>
        <Text style={styles.label}>Location</Text>
        <Text style={styles.value}>{meeting.location}</Text>
        <Text style={styles.label}>Created By</Text>
        <Text style={styles.value}>{meeting.createdBy}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 20 },
  label: { fontWeight: 'bold', marginTop: 18, fontSize: 15, color: '#333' },
  value: { fontSize: 16, color: '#555', marginTop: 4 },
  errorText: { color: 'red', textAlign: 'center', marginTop: 40 },
});