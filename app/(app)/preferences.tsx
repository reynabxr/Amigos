import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth, db } from '../../services/firebaseConfig';

const NO_RESTRICTIONS = "I have no dietary restrictions";

const ALL_PREFERENCES = [
  'Halal', 'Vegetarian', 'Vegan', 'Pescatarian', 'Kosher',
  'Lactose intolerant', 'Non-spicy', 'No beef', 'Nut allergy',
  'Soy allergy', 'Shellfish allergy', 'Seafood allergy', 'Egg allergy',
];

const ALL_OPTIONS = [NO_RESTRICTIONS, ...ALL_PREFERENCES];

export default function DietaryPreferencesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ isOnboarding?: string }>();
  const isOnboarding = params.isOnboarding === 'true'; // check if user is onboarding or just editing preferences
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      setIsLoading(true);
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.dietaryPreferences && Array.isArray(userData.dietaryPreferences)) {
              if (userData.dietaryPreferences.length === 0) {
                setSelectedPreferences([NO_RESTRICTIONS]);
              } else if (userData.dietaryPreferences.includes(NO_RESTRICTIONS)) {
                setSelectedPreferences([NO_RESTRICTIONS]);
              } else {
              setSelectedPreferences(userData.dietaryPreferences);
              }
            } else if (userData.dietaryPreferences === undefined) {
                setSelectedPreferences([NO_RESTRICTIONS]);
            }
          } else {
            setSelectedPreferences([NO_RESTRICTIONS]);
          }
        } catch (error) {
          console.error('Error fetching dietary preferences:', error);
          Alert.alert('Error', 'Could not load your dietary preferences.');
          setSelectedPreferences([NO_RESTRICTIONS]);
        }
      } else {
        console.warn('No user is currently signed in.');
        router.replace('/(auth)/login'); // redirect to login if no user
      }
      setIsLoading(false);
    };
    fetchPreferences();
  }, []);
        
  const handleTogglePreference = (preference: string) => {
    setSelectedPreferences((prevSelected) => {
    if (preference === NO_RESTRICTIONS) {
      if (prevSelected.includes(NO_RESTRICTIONS)) {
        return [];
      } else {
        return [NO_RESTRICTIONS];
      }
    } else {
      const newSelected = prevSelected.includes(preference)
        ? prevSelected.filter((p) => p !== preference && p !== NO_RESTRICTIONS) // deselect
        : [...prevSelected.filter(p => p !== NO_RESTRICTIONS), preference]; // select
      if (newSelected.length === 0 && prevSelected.includes(NO_RESTRICTIONS) && prevSelected.length === 1) {
        return [NO_RESTRICTIONS];
      }
      if (newSelected.length === 0) {
        return [NO_RESTRICTIONS];
      }
      return newSelected;
    }
    });
  };

  const savePreferences = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert('Error', 'No user is currently signed in.');
      router.replace('/(auth)/login'); // redirect to login if no user
      return false;
    }
    const preferencesToSave = selectedPreferences.includes(NO_RESTRICTIONS) || selectedPreferences.length === 0
      ? [] // save as empty array
      : selectedPreferences.filter((p) => p !== NO_RESTRICTIONS);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        await updateDoc(userDocRef, {
          dietaryPreferences: selectedPreferences,
        });
      } else {
        await setDoc(userDocRef, {
          dietaryPreferences: selectedPreferences,
          createdAt: new Date(),
        }, { merge: true });
      }
      return true;
    } catch (error) {
      console.error('Error saving dietary preferences:', error);
      Alert.alert('Error', 'Could not save your dietary preferences.');
      return false;
    }
  };
  
  const handleConfirm = async () => {
    setIsSaving(true);
    console.log('Selected Preferences:', selectedPreferences);
    const success = await savePreferences();
    if (success) {
      if (isOnboarding) {
        router.replace('/(app)/home');
      } else {
        router.replace('./profile');
      }
    } 
    setIsSaving(false);
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EA4080" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Custom Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dietary Restrictions</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        <Text style={styles.subtitle}>
          Help us to understand your dietary restrictions to recommend suitable food places.
        </Text>

        <View style={styles.tagsContainer}>
          {ALL_OPTIONS.map((preference) => {
            const isSelected = selectedPreferences.includes(preference);
            const isNoRestrictionsOption = preference === NO_RESTRICTIONS;
            return (
              <TouchableOpacity
                key={preference}
                style={[
                  styles.tag,
                  isSelected ? styles.tagSelected : styles.tagUnselected
                ]}
                onPress={() => handleTogglePreference(preference)}
              >
                <Text
                  style={[
                    styles.tagText,
                    isSelected ? styles.tagTextSelected : styles.tagTextUnselected
                  ]}
                >
                  {preference}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Confirm Button Area */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity onPress={handleConfirm} style={styles.actionButton} disabled={isSaving}>
          <LinearGradient
            colors={isSaving ? ['#ccc', '#aaa'] : ['#ea4080', '#FFC174']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.gradient}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>CONFIRM</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff', // White background for the screen
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20, // Space for content before the button
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  tag: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    margin: 5,
  },
  tagUnselected: {
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  tagSelected: {
    borderColor: '#EA4080', 
    backgroundColor: '#fff0f0', 
  },
  tagText: {
    fontSize: 14,
  },
  tagTextUnselected: {
    color: '#777', 
  },
  tagTextSelected: {
    color: '#EA4080', 
    fontWeight: '500',
  },
actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  actionButton: {
    minWidth: '45%',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    marginHorizontal: 5,
  },
  gradient: {
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 25, 
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
