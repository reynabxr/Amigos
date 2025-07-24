import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Place } from '../services/types';

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

export function RestaurantCard({ place }: { place: Place }) {
  // pick category or fallback to the first cuisine 
  const cuisineOrCategory =
    categoryIconNames[place.category] ||
    (place.cuisines && place.cuisines.length > 0 && categoryIconNames[place.cuisines[0]]) ||
    'silverware-fork-knife'; // default fallback

  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name={cuisineOrCategory as any}
          size={120}
          color="#EA4080"
        />
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{place.name}</Text>
        <Text style={styles.category}>{place.category}</Text>
        <Text style={styles.address}>{place.address}</Text>
        <Text style={styles.budget}>
          {place.budget ? `Budget: ${place.budget}` : 'Budget: Unknown'}
        </Text>
        <Text style={styles.cuisines}>
          {place.cuisines && place.cuisines.length > 0
            ? `Cuisine: ${place.cuisines.join(', ')}`
            : ''}
        </Text>
        <Text style={styles.dietary}>
          {place.dietaryFlags && place.dietaryFlags.length > 0
            ? `Dietary: ${place.dietaryFlags.join(', ')}`
            : ''}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    width: 340,
    height: 520,
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    marginVertical: 20,
  },
  iconContainer: {
    width: '100%',
    height: 220,
    backgroundColor: '#fffbe6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    padding: 18,
    justifyContent: 'flex-start',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#222',
  },
  category: {
    fontSize: 15,
    color: '#EA4080',
    marginBottom: 4,
  },
  address: {
    fontSize: 13,
    color: '#777',
    marginBottom: 8,
  },
  budget: {
    fontSize: 14,
    color: '#444',
    marginBottom: 2,
  },
  cuisines: {
    fontSize: 14,
    color: '#444',
    marginBottom: 2,
  },
  dietary: {
    fontSize: 13,
    color: '#4CAF50',
    marginTop: 4,
  },
})