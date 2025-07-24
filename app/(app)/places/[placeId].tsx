import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RestaurantCard } from '../../../components/RestaurantCard';
import { StarRating } from '../../../components/StarRating';
import { auth, db } from '../../../services/firebaseConfig';
import type { Place } from '../../../services/types';

export default function PlaceDetailScreen() {
  const { placeId, placeData } = useLocalSearchParams<{ placeId: string, placeData?: string }>();
  
  const [place, setPlace] = useState<Place | null>(null);
  const [userRating, setUserRating] = useState(0);
  const [loadingRating, setLoadingRating] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Step 1: Parse the place data passed from the previous screen
  useEffect(() => {
    if (placeData) {
      try {
        const parsedPlace = JSON.parse(placeData);
        if (typeof parsedPlace.visitedAt === 'number') {
            parsedPlace.visitedAt = new Date(parsedPlace.visitedAt);
        }
        setPlace(parsedPlace);
      } catch (e) {
        console.error("Failed to parse place data:", e);
      }
    }
  }, [placeData]);

  // Step 2: Listen for the user's rating for this specific place
  useEffect(() => {
    if (!placeId || !auth.currentUser) {
      setLoadingRating(false);
      return;
    }
    
    setLoadingRating(true);
    const ratingRef = doc(db, 'users', auth.currentUser.uid, 'ratings', placeId);
    
    const unsubscribe = onSnapshot(ratingRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserRating(docSnap.data().rating);
      } else {
        setUserRating(0); // No rating exists yet
      }
      setLoadingRating(false);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [placeId]);

  // Step 3: Function to handle saving a new rating
  const handleRatePlace = async (rating: number) => {
    if (!placeId || !auth.currentUser || isSaving) return;

    setIsSaving(true);
    try {
      const ratingRef = doc(db, 'users', auth.currentUser.uid, 'ratings', placeId);
      await setDoc(ratingRef, {
        placeId: placeId,
        rating: rating,
        updatedAt: new Date(),
      }, { merge: true }); // Use merge to avoid overwriting other fields
      
      Alert.alert('Success', 'Your rating has been saved!');
    } catch (error) {
      console.error("Error saving rating:", error);
      Alert.alert('Error', 'Could not save your rating.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!place) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#EA4080" />
        <Text>Loading place details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: place.name || 'Place Details',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()} // Navigates to the previous screen
              style={{ marginLeft: 20 }}
            >
              <Ionicons name="arrow-back" size={24} color="#EA4080" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <RestaurantCard place={place} />

        <View style={styles.ratingSection}>
          <Text style={styles.ratingHeader}>Your Rating</Text>
          {loadingRating ? (
            <ActivityIndicator color="#EA4080" />
          ) : (
            <StarRating rating={userRating} onRate={handleRatePlace} size={40} />
          )}
          {isSaving && <ActivityIndicator style={{ marginTop: 10 }} size="small" />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f4f8' },
  container: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  ratingSection: {
      backgroundColor: 'white',
      paddingVertical: 20,
      paddingHorizontal: 15,
      borderRadius: 18,
      alignItems: 'center',
      marginTop: -50, 
      marginHorizontal: 20,
      zIndex: 10,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 10,
      elevation: 5,
  },
  ratingHeader: {
      fontSize: 18,
      fontWeight: '600',
      color: '#333',
      marginBottom: 15,
  },
});