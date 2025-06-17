import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
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
  const [initialPreferences, setInitialPreferences] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPreferences = useCallback(async () => {
      setIsLoading(true);
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          let currentPrefs: string[] = [];
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.dietaryPreferences && Array.isArray(userData.dietaryPreferences)) {
              if (userData.dietaryPreferences.length === 0) {
                currentPrefs = [NO_RESTRICTIONS];
              } else {
                currentPrefs = userData.dietaryPreferences.filter(p => p !== NO_RESTRICTIONS);
                if (currentPrefs.length === 0 && userData.dietaryPreferences.length > 0) {
                  currentPrefs = [NO_RESTRICTIONS];
                }
              }
            } else {
              currentPrefs = [NO_RESTRICTIONS];
            }
          } else {
            currentPrefs = [NO_RESTRICTIONS];
          }
          setSelectedPreferences([...currentPrefs]);
          setInitialPreferences([...currentPrefs]);
        } catch (error) {
          console.error('Error fetching dietary preferences:', error);
          Alert.alert('Error', 'Could not load your dietary preferences.');
          setSelectedPreferences([NO_RESTRICTIONS]);
          setInitialPreferences([NO_RESTRICTIONS]);
        }
      } else {
        console.warn('No user is currently signed in.');
        router.replace('/(auth)/login'); // redirect to login if no user
      }
      setIsLoading(false);
    }, []);
  
  useEffect(() => {
   fetchPreferences();
   }, [fetchPreferences]);
  
  useFocusEffect(
    useCallback(() => {
      console.log("DietaryPreferencesScreen: Screen focused, fetching preferences.");
      fetchPreferences();
      return () => {
        // Cleanup if needed
      };
    }, [fetchPreferences])
  );

  const handleGoBack = () => {
    router.replace('/profile'); // go back to profile screen
  };

  const handleTogglePreference = (preference: string) => {
    setSelectedPreferences((prevSelected) => {
      let newSelectedState: string[];
      if (preference === NO_RESTRICTIONS) {
        newSelectedState = prevSelected.includes(NO_RESTRICTIONS) ? [] : [NO_RESTRICTIONS];
      } else {
        const currentlySelected = prevSelected.includes(preference);
        let tempSelected = prevSelected.filter(p => p !== NO_RESTRICTIONS);
        
        if (currentlySelected) {
          tempSelected = tempSelected.filter(p => p !== preference);
        } else {
          tempSelected = [...tempSelected, preference];
        }
        newSelectedState = tempSelected.length == 0? [NO_RESTRICTIONS] : tempSelected;
      }
        return newSelectedState;
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
      const dataToUpdate = {dietaryPreferences: preferencesToSave};
      if (userDoc.exists()) {
        await updateDoc(userDocRef, dataToUpdate);
      } else {
        await setDoc(userDocRef, {
          ...dataToUpdate,
          email: currentUser.email,
          username: currentUser.displayName || '',
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

  const havePreferencesChanged = () => {
    const currentToCompare = selectedPreferences.includes(NO_RESTRICTIONS) && selectedPreferences.length === 1
        ? []
        : selectedPreferences.filter(p => p !== NO_RESTRICTIONS);
    const initialToCompare = initialPreferences.includes(NO_RESTRICTIONS) && initialPreferences.length === 1
        ? []
        : initialPreferences.filter(p => p !== NO_RESTRICTIONS);

    const sortedCurrent = [...currentToCompare].sort();
    const sortedInitial = [...initialToCompare].sort();
    const changed = JSON.stringify(sortedCurrent) !== JSON.stringify(sortedInitial);
    console.log("Preferences changed:", changed, "Current:", sortedCurrent, "Initial:", sortedInitial);
    return changed;
  };
  
  const handleConfirm = async () => {
    setIsSaving(true);
    console.log('Selected Preferences:', selectedPreferences);
    const success = await savePreferences();
    if (success) {
      setInitialPreferences([...selectedPreferences]);
      if (isOnboarding) {
        router.replace('/(app)/home');
      } else {
        handleGoBack();
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

  const canConfirm = isOnboarding || havePreferencesChanged();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Custom Header */}
      <View style={styles.header}>
        {!isOnboarding && (<TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        )}
        <Text style={
          isOnboarding ? styles.headerTitleCentered : styles.headerTitle
          }>Dietary Restrictions</Text>
        {!isOnboarding && (<View style={styles.headerRightPlaceholder} />)}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        <Text style={styles.subtitle}>
          Help us to understand your dietary restrictions to recommend suitable food places. You can always change these preferences later.
        </Text>

        <View style={styles.tagsContainer}>
          {ALL_OPTIONS.map((preference) => {
            const isSelected = selectedPreferences.includes(preference);
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
        <TouchableOpacity 
          onPress={handleConfirm} 
          style={styles.actionButton} 
          disabled={isSaving || !canConfirm }
        >
          <LinearGradient
            colors={(isSaving || !canConfirm) ? ['#ccc', '#aaa'] : ['#ea4080', '#FFC174']}
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
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff'
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRightPlaceholder: {
    width: 28 + 10,
  },
  headerTitleCentered: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  actionButton: {
    minWidth: '100%',
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
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
