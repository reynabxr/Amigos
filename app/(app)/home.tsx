import { Ionicons } from '@expo/vector-icons'; // For example icons
import React from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Sample Data (replace with your actual data fetching)
const upcomingMeetingsData = [
  { id: '1', title: 'Tan Family', time: 'Tomorrow, 11:00 AM', location: 'The Brew Spot', attendees: ['Alex', 'You'] },
  { id: '2', title: 'Study Group', time: 'Friday, 6:00 PM', location: 'Yakiniku like (Clementi Mall)', attendees: ['Sarah', 'Mike', 'You'] },
];

const placesEatenData = [
  { id: '1', name: 'Pizza Hut', lastVisited: 'Last week', rating: 4, image: 'https://via.placeholder.com/100x80.png?text=Pizza' },
  { id: '2', name: 'Sushi Express', lastVisited: '2 weeks ago', rating: 5, image: 'https://via.placeholder.com/100x80.png?text=Sushi' },
  { id: '3', name: 'Burger King', lastVisited: 'Last month', rating: 3, image: 'https://via.placeholder.com/100x80.png?text=Burger' },
];

const SectionCard = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <View style={styles.sectionCard}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const MeetingItem = ({ item }: { item: typeof upcomingMeetingsData[0] }) => (
  <TouchableOpacity style={styles.meetingItem}>
    <View style={styles.meetingDetails}>
      <Text style={styles.meetingTitle}>{item.title}</Text>
      <Text style={styles.meetingTimeLocation}>{item.time} - {item.location}</Text>
      <Text style={styles.meetingAttendees}>Attendees: {item.attendees.join(', ')}</Text>
    </View>
    <Ionicons name="chevron-forward" size={24} color="#ccc" />
  </TouchableOpacity>
);

const PlaceItem = ({ item }: { item: typeof placesEatenData[0] }) => (
  <TouchableOpacity style={styles.placeItem}>
    <Image source={{ uri: item.image }} style={styles.placeImage} />
    <View style={styles.placeDetails}>
      <Text style={styles.placeName}>{item.name}</Text>
      <Text style={styles.placeInfo}>Last visited: {item.lastVisited}</Text>
      <Text style={styles.placeInfo}>Rating: {'⭐'.repeat(item.rating)}</Text>
    </View>
    <Ionicons name="chevron-forward" size={24} color="#ccc" />
  </TouchableOpacity>
);


export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Upcoming Meetings Section */}
        <SectionCard title="Upcoming Meetings">
          {upcomingMeetingsData.length > 0 ? (
            upcomingMeetingsData.map(item => <MeetingItem key={item.id} item={item} />)
          ) : (
            <Text style={styles.emptyText}>No upcoming meetings.</Text>
          )}
          <TouchableOpacity style={styles.seeAllButton}>
            <Text style={styles.seeAllText}>See All Meetings</Text>
          </TouchableOpacity>
        </SectionCard>

        {/* Places Eaten Section */}
        <SectionCard title="Places I've Eaten At">
          {placesEatenData.length > 0 ? (
            placesEatenData.map(item => <PlaceItem key={item.id} item={item} />)
          ) : (
            <Text style={styles.emptyText}>No places recorded yet.</Text>
          )}
          <TouchableOpacity style={styles.seeAllButton}>
            <Text style={styles.seeAllText}>See All Places</Text>
          </TouchableOpacity>
        </SectionCard>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f4f8', // Light background for the whole app
  },
  container: {
    padding: 15,
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  meetingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  meetingDetails: {
    flex: 1,
  },
  meetingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
  },
  meetingTimeLocation: {
    fontSize: 14,
    color: '#777',
    marginTop: 2,
  },
  meetingAttendees: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },
  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  placeImage: {
    width: 80,
    height: 60,
    borderRadius: 6,
    marginRight: 15,
  },
  placeDetails: {
    flex: 1,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
  },
  placeInfo: {
    fontSize: 14,
    color: '#777',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    paddingVertical: 20,
    fontSize: 15,
  },
  seeAllButton: {
    marginTop: 15,
    alignItems: 'flex-end',
  },
  seeAllText: {
    fontSize: 14,
    color: '#EA4080', 
    fontWeight: '600',
  },
});
