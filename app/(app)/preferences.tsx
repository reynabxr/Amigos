import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const ALL_PREFERENCES = ['Select your restrictions (if any)',
  'Halal', 'Vegetarian', 'Vegan', 'Pescatarian', 'Kosher',
  'Lactose intolerant', 'Non-spicy', 'No beef', 'Nut allergy',
  'Soy allergy', 'Shellfish allergy', 'Seafood allergy', 'Egg allergy',
];

const INITIALLY_HIGHLIGHTED = ['Select your restrictions (if any)'];

export default function DietaryPreferencesScreen() {
  const router = useRouter();
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);

  const handleTogglePreference = (preference: string) => {
    setSelectedPreferences((prevSelected) =>
      prevSelected.includes(preference)
        ? prevSelected.filter((p) => p !== preference) // Deselect
        : [...prevSelected, preference] // Select
    );
  };

  const handleContinue = () => {
    console.log('Selected Preferences:', selectedPreferences);
    // TODO: Save preferences 
    router.push('/profile');
    alert(`Selected: ${selectedPreferences.join(', ')}`);
  };

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
          {ALL_PREFERENCES.map((preference) => {
            const isSelected = selectedPreferences.includes(preference);
            
            const isVisuallyHighlighted = INITIALLY_HIGHLIGHTED.includes(preference);

            return (
              <TouchableOpacity
                key={preference}
                style={[
                  styles.tag,
                  isSelected ? styles.tagSelected : (isVisuallyHighlighted ? styles.tagSelected : styles.tagUnselected),
                ]}
                onPress={() => handleTogglePreference(preference)}
              >
                <Text
                  style={[
                    styles.tagText,
                    isSelected ? styles.tagTextSelected : (isVisuallyHighlighted ? styles.tagTextSelected : styles.tagTextUnselected),
                  ]}
                >
                  {preference}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Continue Button Area */}
      <View style={styles.continueButtonContainer}>
        <TouchableOpacity onPress={handleContinue} style={styles.continueButtonTouchable}>
          <LinearGradient
            colors={['#ea4080', '#FFC174']} 
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.gradient}
          >
            <Text style={styles.continueButtonText}>CONTINUE</Text>
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
    justifyContent: 'center', // Center tags if they don't fill the row
  },
  tag: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20, // Pill shape
    borderWidth: 1,
    margin: 5, // Spacing between tags
  },
  tagUnselected: {
    borderColor: '#ccc', // Light grey border
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
    color: '#777', // Darker grey text
  },
  tagTextSelected: {
    color: '#EA4080', 
    fontWeight: '500',
  },
  continueButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15, // Padding around the button
    borderTopWidth: 1, 
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff', 
  },
  continueButtonTouchable: {
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
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
