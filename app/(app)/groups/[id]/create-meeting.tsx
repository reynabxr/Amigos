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
  ScrollView,
  FlatList
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

  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const minimumTime = isToday ? now : undefined;

  function LocationInput({
    location,
    setLocation,
  }: {
    location: string;
    setLocation: (val: string) => void;
  }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);

    const fetchSuggestions = async (text: string) => {
      setQuery(text);
      if (text.length < 2) return;

      try {
        const response = await fetch(
          `https://api.foursquare.com/v3/places/autocomplete?query=${encodeURIComponent(text)}&near=Singapore`,
          {
            headers: {
              Authorization: process.env.FOURSQUARE_API_KEY ?? '',
              Accept: 'application/json',
            },
          }
        );
        const json = await response.json();
        setResults(json.results || []);
      } catch (err) {
        console.error('Foursquare API error', err);
      }
    };

    return (
      <View>
        <TextInput
          style={styles.input}
          placeholder="e.g. Kent Ridge"
          value={query || location}
          onChangeText={fetchSuggestions}
        />
        {results.length > 0 && (
          <FlatList
            data={results}
            keyExtractor={(item) => item.fsq_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => {
                  setLocation(item.text || item.name);
                  setQuery(item.text || item.name);
                  setResults([]);
                }}
              >
                <Text>{item.text || item.name}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: 'Create Meeting' }} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
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
          onPress={() => setShowDatePicker(!showDatePicker)}
        >
          <Ionicons name="calendar-outline" size={18} color="#4A90E2" />
          <Text style={styles.dateButtonText}>
            {date.toLocaleString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <>
            <Text style={{ fontWeight: 'bold', marginTop: 10 }}>Pick a Date</Text>
            <DateTimePicker
              value={date}
              mode="date"
              display="inline"
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  const updated = new Date(date);
                  updated.setFullYear(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth(),
                    selectedDate.getDate()
                  );
                  setDate(updated);
                }
              }}
              minimumDate={new Date()}
            />

            <Text style={{ fontWeight: 'bold', marginTop: 10 }}>Pick a Time</Text>
              <DateTimePicker
                value={date}
                mode="time"
                display="spinner"
                onChange={(event, selectedTime) => {
                  if (selectedTime) {
                    const updated = new Date(date);
                    updated.setHours(
                      selectedTime.getHours(),
                      selectedTime.getMinutes()
                    );
                    setDate(updated);
                  }
                }}
                minimumDate={minimumTime}
              />

              <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.doneButton}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </>
        )}

        <Text style={styles.label}>Location</Text>
        <LocationInput location={location} setLocation={setLocation} />

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
      </ScrollView>
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
  doneButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#EA4080',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 10,
  },
  doneButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  resultItem: {
    padding: 10,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
    backgroundColor: '#f9f9f9',
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