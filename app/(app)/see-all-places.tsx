import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StarRating } from '../../components/StarRating';
import { auth, db } from '../../services/firebaseConfig';

const cuisineIconNames: Record<string, string> = {
  Japanese: 'food-croissant',        
  Chinese: 'noodles',
  Western: 'hamburger',
  Indian: 'food-variant',
  Malay: 'rice',
  Korean: 'food',
  Thai: 'noodles',
  Vietnamese: 'noodles',
  Mediterranean: 'food-variant',
};

  // foursquare categories:
const categoryIconNames: Record<string, string> = {
  'Ramen Restaurant': 'noodles',
  'Noodle Restaurant': 'noodles',
  'Japanese Restaurant': 'noodles',
  'French Restaurant': 'eiffel-tower',
  'Italian Restaurant': 'pasta',
  'Seafood Restaurant': 'fish',
  'Fast Food Restaurant': 'hamburger',
  'Café': 'coffee',
  'Coffee Shop': 'coffee',
  'Salad Restaurant': 'food-apple',
  'Pizza Place': 'pizza',
  'Bakery': 'bread-slice',
  'Steakhouse': 'food-steak',
  'Bar': 'glass-cocktail',
  'Soup Spot': 'food-apple',
};

const PlaceItem = ({ item, onPress }: { item: any, onPress: () => void }) => {
  if (item.image) {
    return (
      <TouchableOpacity style={styles.placeBubble} onPress={onPress} activeOpacity={0.85}>
        <Image source={{ uri: item.image }} style={styles.placeImage} />
        <View style={styles.placeDetails}>
          <Text style={styles.placeName} numberOfLines={1}>{item.name}</Text>
          <StarRating rating={item.rating} size={18} />
          <Text style={styles.placeInfo}>
            Visited with <Text style={styles.groupNameHighlight}>{item.groupName}</Text> on {item.visitedAt ? new Date(item.visitedAt).toLocaleDateString() : '—'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#ccc" />
      </TouchableOpacity>
    );
  }

  const iconName = categoryIconNames[item.category] || (item.cuisines && cuisineIconNames[item.cuisines[0]])  || 'silverware-fork-knife';

  return (
    <TouchableOpacity style={styles.placeBubble} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.placeIconContainer}>
        <MaterialCommunityIcons name={iconName as any} size={40} color="#EA4080" />
      </View>
      <View style={styles.placeDetails}>
        <Text style={styles.placeName} numberOfLines={1}>{item.name}</Text>
        <StarRating rating={item.rating} size={18} />
         <Text style={styles.placeInfo}>
            Visited with <Text style={styles.groupNameHighlight}>{item.groupName}</Text> on {item.visitedAt ? new Date(item.visitedAt).toLocaleDateString() : '—'}
          </Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#ccc" />
    </TouchableOpacity>
  );
};

export default function SeeAllPlacesScreen() {
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const fetchAllVisitedPlaces = async () => {
        const user = auth.currentUser;
        if (!user) {
          setPlaces([]);
          setLoading(false);
          return;
        }

        setLoading(true);
        try {
          const groupsQuery = query(collection(db, 'groups'), where('members', 'array-contains', user.uid));
          const groupsSnapshot = await getDocs(groupsQuery);
          
          let allHistoryItems: any[] = [];
          const ratingsMap = new Map<string, number>();
          const ratingsSnapshot = await getDocs(query(collection(db, 'users', user.uid, 'ratings')));
          ratingsSnapshot.forEach(doc => ratingsMap.set(doc.data().placeId, doc.data().rating));

          for (const groupDoc of groupsSnapshot.docs) {
            const meetingsQuery = query(collection(db, 'groups', groupDoc.id, 'meetings'), where('eatingConfirmed', '==', true));
            const meetingsSnapshot = await getDocs(meetingsQuery);
            for (const meetingDoc of meetingsSnapshot.docs) {
              const meetingData = meetingDoc.data();
              const finalPlaceId = meetingData.finalPlaceId;
              if (finalPlaceId && typeof meetingData.date === 'number') {
                const placeDocRef = doc(db, 'groups', groupDoc.id, 'meetings', meetingDoc.id, 'recommendations', finalPlaceId);
                const placeDoc = await getDoc(placeDocRef);
                if (placeDoc.exists()) {
                  allHistoryItems.push({
                    id: placeDoc.id,
                    ...placeDoc.data(),
                    visitedAt: meetingData.date, 
                    rating: ratingsMap.get(finalPlaceId) || 0,
                    groupName: groupDoc.data().name,
                  });
                }
              }
            }
          }
          allHistoryItems.sort((a, b) => (b.visitedAt || 0) - (a.visitedAt || 0));
          setPlaces(allHistoryItems);
        } catch (error) {
          console.error("Error fetching all visited places:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchAllVisitedPlaces();
    }, [])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: 'All Visited Places',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.replace('/home')} style={{ marginLeft: 25 }}>
              <Ionicons name="arrow-back" size={24} color="#EA4080" />
            </TouchableOpacity>
          ),
        }}
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EA4080" />
        </View>
      ) : (
        <FlatList
          data={places}
          contentContainerStyle={styles.container}
          keyExtractor={(item) => `${item.id}-${item.visitedAt}`}
          ListEmptyComponent={<Text style={styles.emptyText}>No visited places found.</Text>}
          renderItem={({ item }) => (
            <PlaceItem
              item={item}
              onPress={() => router.push({
                  pathname: "/places/[placeId]",
                  params: { placeId: item.id, placeData: JSON.stringify(item) },
              })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f4f8' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 20, paddingBottom: 40 },
  placeBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  placeImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 15,
    backgroundColor: '#e0e0e0',
  },
  placeIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 15,
    backgroundColor: '#fff0f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  placeDetails: { flex: 1, justifyContent: 'center' },
  placeName: { fontSize: 17, fontWeight: '700', color: '#444', marginBottom: 6 },
  placeInfo: { fontSize: 13, color: '#777', marginTop: 6 },
  emptyText: { textAlign: 'center', color: '#888', paddingVertical: 30, fontSize: 17 },
  groupNameHighlight: {
    fontWeight: 'bold',
    color: '#EA4080',
  }
});