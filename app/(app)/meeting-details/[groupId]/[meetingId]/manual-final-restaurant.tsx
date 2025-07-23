import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, writeBatch } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { db } from '../../../../../services/firebaseConfig';
import {
  FSQ_API_VERSION,
  FSQ_BASE,
  FSQ_TOKEN,
} from '../../../../../services/foursquareConfig';
import { fetchFoursquarePhoto } from '../../../../../services/recommendationServices';
import type { Place } from '../../../../../services/types';


export default function ConfirmManualPlaceScreen() {
  const router = useRouter();
  const { groupId, meetingId } = useLocalSearchParams<{ groupId: string; meetingId: string }>();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [fsqResults, setFsqResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const searchFoursquare = async (text: string) => {
    setSearchQuery(text);
    if (text.length < 3) {
      setFsqResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const params = new URLSearchParams({
        query: text,
        limit: '5',
        near: 'Singapore', 
      });

      const res = await fetch(`${FSQ_BASE}/search?${params.toString()}`, {
        headers: {
          accept: 'application/json',
          'X-Places-Api-Version': FSQ_API_VERSION,
          authorization: FSQ_TOKEN,
        },
      });
      if (!res.ok) throw new Error("API request failed");
      const json = await res.json();
      setFsqResults(json.results || []);
    } catch (e) {
      console.error("Foursquare search failed:", e);
      setFsqResults([]);
    }
    setIsSearching(false);
  };

const handleSelectAndConfirm = async (item: any) => {
    if (isConfirming) return;
    setIsConfirming(true);
    Keyboard.dismiss();
    setFsqResults([]);

    const placeId = item.fsq_id || item.fsq_place_id || item.id;

    if (!placeId) {
        Alert.alert('Error', 'This place cannot be selected as it is missing a required ID.');
        setIsConfirming(false);
        return;
    }
    
    const selectedPlace: Partial<Place> = {
        id: placeId,
        name: item.name || null,
        address: item.location?.formatted_address || null,
        lat: item.geocodes?.main?.latitude || 0, 
        lng: item.geocodes?.main?.longitude || 0, 
        category: item.categories?.[0]?.name || null,
    };
    
    try {
      const imageUrl = await fetchFoursquarePhoto(selectedPlace.id!);
      const completePlace = { ...selectedPlace, image: imageUrl || null } as Place;

      const batch = writeBatch(db);
      
      const meetingDocRef = doc(db, 'groups', groupId!, 'meetings', meetingId!);
      batch.update(meetingDocRef, {
        eatingConfirmed: true,
        finalPlaceId: completePlace.id,
        finalRecommendations: [completePlace.id]
      });
      
      const recommendationRef = doc(db, 'groups', groupId!, 'meetings', meetingId!, 'recommendations', completePlace.id);
      batch.set(recommendationRef, completePlace, { merge: true });

      await batch.commit(); 

      Alert.alert('Success!', `${completePlace.name} has been confirmed.`);
      router.back();
    } catch (error: any) {
      console.error("Confirmation Error: ", error);
      Alert.alert('Error', error.message || 'Could not confirm this place.');
    } finally {
      setIsConfirming(false);
    }
  };

   return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: 'Confirm Final Place' }} />
      <View style={styles.container}>
        <View style={{ position: 'relative', zIndex: 10 }}>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={20} color="#888" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for any restaurant..."
              value={searchQuery}
              onChangeText={searchFoursquare}
              autoFocus
            />
          </View>
          {isSearching && <ActivityIndicator style={{ marginTop: 8 }} size="small" color="#EA4080" />}
          
          {fsqResults.length > 0 && (
            <View style={styles.resultsDropdown}>
              {fsqResults.map(item => (
                <TouchableOpacity
                  key={item.fsq_id}
                  style={styles.resultItem}
                  onPress={() => handleSelectAndConfirm(item)}
                >
                  <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
                  <Text style={{ color: '#666', fontSize: 13, marginTop: 2 }}>
                    {item.location?.formatted_address}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {isConfirming && (
            <View style={styles.confirmingOverlay}>
                <ActivityIndicator size="large" color="#EA4080" />
                <Text style={styles.confirmingText}>Confirming...</Text>
            </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9f9f9' },
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchInput: { flex: 1, height: 50, fontSize: 16 },
  resultsDropdown: {
    position: 'absolute',
    top: 55, 
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    zIndex: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  resultItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomColor: '#f0f0f0',
    borderBottomWidth: 1,
  },
  confirmingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  confirmingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  }
});