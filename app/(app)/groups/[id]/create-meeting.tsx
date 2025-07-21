import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../../../../services/firebaseConfig';
import { FSQ_API_VERSION, FSQ_TOKEN } from '../../../../services/foursquareConfig';

export default function CreateMeetingScreen() {
  const router = useRouter();
  const { id: groupId } = useLocalSearchParams<{ id: string }>();

  const [meetingName, setMeetingName] = useState('');
  const [location, setLocation] = useState('');
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
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
  if (lat === null || lng === null) {
    Alert.alert('Error', 'Please select a location from the dropdown.');
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
      lat,
      lng,
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
    const [fadeAnim] = useState(new Animated.Value(0));
    const [heightAnim] = useState(new Animated.Value(0)); 

    const fetchSuggestions = async (text: string) => {
      setQuery(text);
      if (text.length < 2) {
        setResults([]);
        fadeAnim.setValue(0);
        heightAnim.setValue(0);
        return;
      }

      const options = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'X-Places-Api-Version': FSQ_API_VERSION,
          authorization: FSQ_TOKEN
        }
      };

      const response = await fetch(`https://places-api.foursquare.com/places/search?query=${encodeURIComponent(text)}&near=Singapore&limit=5`, options);
      const json = await response.json();
      const fetchedResults = json.results || [];
      setResults(json.results || []);
      setResults(fetchedResults);
      if (fetchedResults.length > 0) {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(heightAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }

    // remove duplicate fsq_place_id
    const uniqueResults = results.filter(
      (item, idx, arr) =>
        arr.findIndex(i => i.fsq_place_id === item.fsq_place_id) === idx
    );

    return (
      <View>
        <View style={{ position: 'relative' }}>
        <TextInput
          style={styles.input}
          placeholder="e.g. Kent Ridge"
          value={query || location}
          onChangeText={fetchSuggestions}
          onFocus={() => setShowDatePicker(false)}
        />
        {(query || location) !== '' && (
          <TouchableOpacity
            onPress={() => {
              setQuery('');
              setLocation('');
              setResults([]);
            }}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#aaa" />
          </TouchableOpacity>
        )}
      </View>

        {uniqueResults.length > 0 && (
          <Animated.View
            style={{
              opacity: fadeAnim,
              backgroundColor: '#fff',
              borderRadius: 8,
              borderColor: '#ddd',
              borderWidth: 1,
              marginTop: -10,
              marginBottom: 10,
            }}
          >
          {uniqueResults.map((item, index) => (
            <TouchableOpacity
              key={item.fsq_place_id || index}
              style={styles.resultItem}
              onPress={() => {
                setLocation(item.name);

                const latitude = item.geocodes?.main?.latitude ?? item.latitude;
                const longitude = item.geocodes?.main?.longitude ?? item.longitude;
                if (latitude == null || longitude == null) {
                Alert.alert('Error', 'Selected place has no location data.');
                return;
                }
                setLat(latitude);
                setLng(longitude);
                
                setQuery(item.name);
                setResults([]);
              }}
            >
              <Text>{item.name}</Text>
            </TouchableOpacity>
          ))}
          </Animated.View>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={'padding'}>
      <Stack.Screen options={{ title: 'Create Meeting' }} />
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>Meeting Name</Text>
          <View style={{ position: 'relative' }}>
            <TextInput
              style={styles.input}
              value={meetingName}
              onChangeText={setMeetingName}
              placeholder="e.g. Lunch Catch-up"
              onFocus={() => setShowDatePicker(false)}
            />
            {meetingName !== '' && (
              <TouchableOpacity
                onPress={() => setMeetingName('')}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#aaa" />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.label}>Date & Time</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => {
              Keyboard.dismiss();
              setShowDatePicker(!showDatePicker);
            }}
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
      </KeyboardAvoidingView>
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
  clearButton: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -18 }],
    zIndex: 1,
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