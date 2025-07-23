export const unstable_settings = {
bottomTabs: { visible: false },
};

import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth, db } from '../../services/firebaseConfig';

export default function SeeAllPlacesScreen() {
  const router = useRouter()
  const [places, setPlaces] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const user = auth.currentUser

  useEffect(() => {
    if (!user) {
      setPlaces([])
      setLoading(false)
      return
    }
    setLoading(true)
    const placesRef = collection(db, 'users', user.uid, 'visitedPlaces')
    const q = query(placesRef, orderBy('visitedAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setPlaces(
        snap.docs.map((doc) => {
          const d = doc.data() as any
          return {
            id: doc.id,
            name: d.name,
            address: d.address,
            image: d.image,
            visitedAt: d.visitedAt?.toDate
              ? d.visitedAt.toDate()
              : d.visitedAt
              ? new Date(d.visitedAt)
              : null,
            rating: d.rating,
          }
        })
      )
      setLoading(false)
    })
    return () => unsub()
  }, [user])

  const formatDate = (d: Date | null) =>
    d
      ? d.toLocaleDateString(undefined, {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '—'

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: "All Places I've Eaten",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.replace('/home')}
              style={{ marginLeft: 15 }}
            >
              <Ionicons name="arrow-back" size={24} color="#EA4080" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color="#EA4080" />
        ) : places.length === 0 ? (
          <Text style={styles.emptyText}>
            You haven't recorded any places yet.
          </Text>
        ) : (
          places.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.placeBubble}
              onPress={() =>
                router.push({
                  pathname: '/places/[placeId]',
                  params: { placeId: p.id },
                })
              }
              activeOpacity={0.85}
            >
              <Image
                source={{
                  uri:
                    p.image ||
                    'https://via.placeholder.com/100x80.png?text=Food',
                }}
                style={styles.placeImage}
              />
              <View style={styles.placeDetails}>
                <Text style={styles.placeName}>{p.name}</Text>
                <Text style={styles.placeAddress}>{p.address}</Text>
                <Text style={styles.placeInfo}>
                  Last visited: {formatDate(p.visitedAt)}
                </Text>
                <Text style={styles.placeInfo}>
                  Rating:{' '}
                  {p.rating
                    ? '⭐'.repeat(p.rating)
                    : 'Not rated yet'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#ccc" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f4f8',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  placeBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  placeImage: {
    width: 80,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: '#eee',
  },
  placeDetails: {
    flex: 1,
  },
  placeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#444',
  },
  placeAddress: {
    fontSize: 15,
    color: '#777',
    marginTop: 4,
  },
  placeInfo: {
    fontSize: 14,
    color: '#555',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    paddingVertical: 40,
    fontSize: 16,
  },
})