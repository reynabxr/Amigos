import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Alert,
  ActivityIndicator,
  Button,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addDoc, collection } from 'firebase/firestore';
import { db, auth } from '../../../../services/firebaseConfig';

export default function CreateMeetingScreen() {
  const router = useRouter();
  const { id: groupId } = useLocalSearchParams<{ id: string }>();

  const [meetingName, setMeetingName] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const handleCreateMeeting = async () => {
    if (!meetingName.trim() || !location.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (!groupId) {
      return;
    }
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'groups', groupId, 'meetings'), {
        name: meetingName.trim(),
        location: location.trim(),
        date: date.getTime(),
        createdBy: auth.currentUser?.uid,
        createdAt: Date.now(),
      });
      Alert.alert('Success', 'Meeting created!');
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to create meeting.');
    }
    setIsSaving(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: 'Create Meeting' }} />
      <View style={styles.container}>
        <Text style={styles.label}>Meeting Name</Text>
        <TextInput
          style={styles.input}
          value={meetingName}
          onChangeText={setMeetingName}
          placeholder="e.g. Lunch Catch-up"
        />

        <Text style={styles.label}>Date & Time</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={18} color="#4A90E2" />
          <Text style={styles.dateButtonText}>
            {date.toLocaleString()}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="datetime"
            display={'inline'}
            onChange={handleDateChange}
          />
        )}

        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="e.g. Kent Ridge"
        />

        <TouchableOpacity
          style={styles.saveButtonTouchable}
          onPress={handleCreateMeeting}
          disabled={isSaving}
        >
          <LinearGradient
            colors={isSaving ? ['#ccc', '#aaa'] : ['#ea4080', '#FFC174']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.gradient}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>CREATE</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 20 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8, marginTop: 15 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  dateButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#4A90E2',
  },
  saveButtonTouchable: {
    marginTop: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  gradient: {
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 25,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});