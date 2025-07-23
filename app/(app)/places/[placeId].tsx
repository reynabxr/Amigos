import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../../../services/firebaseConfig';

const StarRating = ({ rating, onRate }: { rating: number; onRate: (newRating: number) => void }) => {
  return (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onRate(star)}>
          <Ionicons
            name={star <= rating ? 'star' : 'star-outline'}
            size={40}
            color={star <= rating ? '#FFC107' : '#ccc'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default function PlaceDetailsScreen() {
  const { placeId } = useLocalSearchParams<{ placeId: string }>();
  const [place, setPlace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user || !placeId) {
      setLoading(false);
      return;
    }
    const placeDocRef = doc(db, 'users', user.uid, 'visitedPlaces', placeId);

    const unsubscribe = onSnapshot(placeDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setPlace({ id: docSnap.id, ...docSnap.data() });
      } else {
        setPlace(null);
        Alert.alert('Error', 'This place could not be found.');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, placeId]);

  const handleRatePlace = async (newRating: number) => {
    if (!user || !placeId || isSubmitting) return;

    setIsSubmitting(true);
    const placeDocRef = doc(db, 'users', user.uid, 'visitedPlaces', placeId);

    try {
      await updateDoc(placeDocRef, {
        rating: newRating,
      });
      // The onSnapshot listener will automatically update the UI
    } catch (error) {
      console.error('Failed to update rating:', error);
      Alert.alert('Error', 'Could not save your rating.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#EA4080" style={{ flex: 1 }} />;
  }

  if (!place) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Place not found.</Text>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: place.name || 'Place Details' }} />
      <ScrollView>
        <Image source={{ uri: place.image || 'https://via.placeholder.com/400x200.png?text=Food' }} style={styles.headerImage} />
        <View style={styles.content}>
          <Text style={styles.placeName}>{place.name}</Text>
          <Text style={styles.placeAddress}>{place.address}</Text>
          <Text style={styles.visitedDate}>
            Visited on: {new Date(place.visitedAt.seconds * 1000).toLocaleDateString()}
          </Text>

          <View style={styles.ratingSection}>
            <Text style={styles.ratingLabel}>Your Rating</Text>
            <StarRating rating={place.rating || 0} onRate={handleRatePlace} />
            {isSubmitting && <ActivityIndicator style={{ marginTop: 10 }} />}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerImage: { width: '100%', height: 250 },
  content: { padding: 20 },
  placeName: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  placeAddress: { fontSize: 16, color: '#666', marginTop: 8 },
  visitedDate: { fontSize: 14, color: '#888', marginTop: 12, fontStyle: 'italic' },
  ratingSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  ratingLabel: { fontSize: 20, fontWeight: '600', color: '#444', marginBottom: 15 },
  starContainer: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
});