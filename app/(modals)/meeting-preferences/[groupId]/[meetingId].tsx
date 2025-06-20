import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../../../services/firebaseConfig';

const CUISINE_OPTIONS = ['Chinese', 'Western', 'Indian', 'Malay', 'Korean', 'Japanese', 'Thai', 'Vietnamese', 'Mediterranean'];
const BUDGET_OPTIONS = ['< $15', '$15 - $30', '$30 - $50', '> $50'];

export default function PreferencesScreen() {
  const router = useRouter();
  const {groupId, meetingId} = useLocalSearchParams<{ groupId: string; meetingId: string;}>();

  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!groupId || !meetingId || !userId) return;
      try {
        const docRef = doc(db, 'groups', groupId, 'meetings', meetingId, 'preferences', userId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setSelectedCuisines(data.cuisines || []);
          setSelectedBudget(data.budget || '');
        }
      } catch (e) {
        console.error('Failed to load preferences:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchPreferences();
  }, [groupId, meetingId, userId]);

  const savePreferences = async () => {
    if (!groupId || !meetingId || !userId) return;

    try {
        setSaving(true);
        await setDoc(doc(db, 'groups', groupId, 'meetings', meetingId, 'preferences', userId), {
        cuisines: selectedCuisines,
        budget: selectedBudget,
        });
        Alert.alert('Saved!', 'Your preferences have been recorded.');
        router.back()
    } catch (e) {
        Alert.alert('Error', 'Failed to save preferences.');
    } finally {
        setSaving(false);
    }
    };


  if (loading) {
    return (
      <SafeAreaView style={styles.centered}><ActivityIndicator size="large" color="#EA4080" /></SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{title: 'Set Preferences'}}
        />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Cuisine Preference</Text>
            <View style={styles.chipContainer}>
            <TouchableOpacity
                style={[
                styles.chip,
                selectedCuisines.length === 0 && styles.chipSelected,
                ]}
                onPress={() => setSelectedCuisines([])}
            >
                <Text style={[
                    styles.chipText,
                    selectedCuisines.length === 0 && styles.chipTextSelected,
                ]}
                >
                    No Preference
                </Text>
            </TouchableOpacity>

            {CUISINE_OPTIONS.map((option) => (
                <TouchableOpacity
                key={option}
                style={[
                    styles.chip,
                    selectedCuisines.includes(option) && styles.chipSelected,
                ]}
                    onPress={() => {
                        if (selectedCuisines.includes(option)) {
                        setSelectedCuisines(selectedCuisines.filter((c) => c !== option));
                        } else {
                        setSelectedCuisines([...selectedCuisines, option]);
                        }
                }}
                >
                <Text style={[
                    styles.chipText,
                    selectedCuisines.includes(option) && styles.chipTextSelected,
                ]}
                >
                    {option}
                </Text>
                </TouchableOpacity>
            ))}
            </View>


        <Text style={styles.sectionTitle}>Budget Preference</Text>
        <View style={styles.radioContainer}>
        <TouchableOpacity
            style={[
                styles.radioOption,
                selectedBudget === '' && styles.radioSelected,
            ]}
            onPress={() => setSelectedBudget('')}
            >
            <Text
                style={[
                styles.radioText,
                selectedBudget === '' && styles.radioTextSelected,
                ]}
            >
                No Preference
            </Text> 
        </TouchableOpacity>

        {BUDGET_OPTIONS.map((option) => (
            <TouchableOpacity
                key={option}
                style={[
                styles.radioOption,
                selectedBudget === option && styles.radioSelected,
                ]}
                onPress={() => setSelectedBudget(option)}
            >
                <Text
                style={[
                    styles.radioText,
                    selectedBudget === option && styles.radioTextSelected,
                ]}
                >
                {option}
                </Text>
            </TouchableOpacity>
            ))}

        </View>


        <TouchableOpacity
            onPress={savePreferences}
            style={styles.saveButtonTouchable}
            disabled={saving}
        >
            <LinearGradient
                colors={['#ea4080', '#FFC174']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.gradient}
            >
                {saving ? (
                <ActivityIndicator color="#fff" />
                ) : (
                <Text style={styles.saveButtonText}>Save Preferences</Text>
                )}
            </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    backgroundColor: '#f9f9f9',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  chipSelected: {
    backgroundColor: '#EA4080',
    borderColor: '#EA4080',
  },
  chipText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#fff',
  },
  radioContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  radioOption: {
    backgroundColor: '#f9f9f9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  radioSelected: {
    backgroundColor: '#EA4080',
    borderColor: '#EA4080',
  },
  radioText: {
    fontSize: 15,
    color: '#333',
  },
  radioTextSelected: {
    color: '#fff',
  },
  saveButtonTouchable: {
    marginTop: 30,
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
