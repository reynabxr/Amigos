
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import type { Place } from '../services/types'

export function RestaurantCard({ place }: { place: Place }) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{place.name}</Text>
      <Text style={styles.category}>{place.category}</Text>
      <Text style={styles.address}>{place.address}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    width: 300,
    height: 380,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    justifyContent: 'flex-end',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  category: {
    fontSize: 14,
    color: '#555',
    marginTop: 6,
  },
  address: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
})