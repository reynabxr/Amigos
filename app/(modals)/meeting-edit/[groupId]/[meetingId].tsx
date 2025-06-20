import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { db } from '../../../../services/firebaseConfig';

export default function EditMeetingScreen() {
  const router = useRouter();
  const {groupId, meetingId} = useLocalSearchParams<{ groupId: string; meetingId: string;}>();
  
  const [initialMeeting, setInitialMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [meetingName, setMeetingName] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [heightAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (!groupId || !meetingId) return;

    const fetchMeeting = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'groups', groupId, 'meetings', meetingId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setInitialMeeting(data);
          setMeetingName(data.name);
          setLocation(data.location);
          setDate(new Date(data.date));
          setQuery(data.location);
        } else {
          Alert.alert('Error', 'Meeting not found');
          router.back();
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load meeting data');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchMeeting();
  }, [groupId, meetingId, router]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); // Keep picker open on iOS
    if (selectedDate) setDate(selectedDate);
  };

  const hasChanges = useMemo(() => {
    if (!initialMeeting) return false;
    return (
      meetingName.trim() !== initialMeeting.name ||
      location.trim() !== initialMeeting.location ||
      date.getTime() !== initialMeeting.date
    );
  }, [meetingName, location, date, initialMeeting]);

  const handleSaveChanges = async () => {
    if (!meetingName.trim() || !location.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (!groupId || !meetingId) return;

    setLoading(true);
    try {
      const docRef = doc(db, 'groups', groupId, 'meetings', meetingId);
      await updateDoc(docRef, {
        name: meetingName.trim(),
        location: location.trim(),
        date: date.getTime(),
      });
      Alert.alert('Success', 'Meeting updated!');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update meeting.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async (text: string) => {
    setQuery(text);
    if (text.length < 2) {
      setResults([]);
      fadeAnim.setValue(0);
      heightAnim.setValue(0);
      return;
    }

    try {
      const options = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'X-Places-Api-Version': '2025-06-17',
          authorization: 'Bearer 0IVYPELNY4LNMALBKREA520UP1HFILQNEAGKPLHLIRPJKOJ0',
        },
      };

      const response = await fetch(
        `https://places-api.foursquare.com/places/search?query=${encodeURIComponent(
          text
        )}&near=Singapore&limit=5`,
        options
      );
      const json = await response.json();
      const fetchedResults = json.results || [];
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
    } catch (e) {
      console.error('Location suggestions error:', e);
      setResults([]);
      fadeAnim.setValue(0);
      heightAnim.setValue(0);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color="#EA4080" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <Stack.Screen
          options={{
            title: 'Edit Meeting',
            headerRight: () => (
              <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 15 }}>
                <Ionicons name="close" size={24} color="#EA4080" />
              </TouchableOpacity>
            ),
          }}
        />
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
                    updated.setHours(selectedTime.getHours(), selectedTime.getMinutes());
                    setDate(updated);
                  }
                }}
              />

              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                style={styles.doneButton}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </>
          )}

          <Text style={styles.label}>Location</Text>
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

            {results.length > 0 && (
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
                {results.map((item, index) => (
                  <TouchableOpacity
                    key={item.fsq_place_id || index}
                    style={styles.resultItem}
                    onPress={() => {
                      setLocation(item.name);
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

          <TouchableOpacity
            style={[
              styles.saveButtonTouchable,
              !hasChanges && { opacity: 0.5 },
            ]}
            onPress={handleSaveChanges}
            disabled={!hasChanges || loading}
          >
            <LinearGradient
              colors={hasChanges ? ['#ea4080', '#FFC174'] : ['#ccc', '#aaa']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.gradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
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
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
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
