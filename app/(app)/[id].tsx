import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { GroupData } from './groups';

export default function GroupDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [group, setGroup] = useState<GroupData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGroupDetails = async () => {
      if (id) {
        setIsLoading(true);
        try {
          const docRef = doc(db, 'groups', id);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setGroup({
              id: docSnap.id,
              name: data.name,
              members: data.members,
              iconType: data.iconType,
              iconName: data.iconName,
              iconSet: availableIcons.find(icon => icon.name === data.iconName)?.set || Ionicons,
              iconColor: data.iconColor,
              iconSource: data.iconSource,
              ownerId: data.ownerId,
              createdAt: data.createdAt,
            } as GroupData);
          } else {
            console.warn('No such group document!', id);
            setGroup(null);
          }
        } catch (error) {
          console.error('Error fetching group details:', error);
          setGroup(null);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchGroupDetails();
  }, [id]);

  if (isLoading || !group) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E15A7C" />
        <Text style={styles.loadingText}>Loading Group Details...</Text>
      </SafeAreaView>
    );
  }

  const selectedIconData = availableIcons.find(icon => icon.name === group.iconName);
  const ActualIconSet = selectedIconData?.set || Ionicons; // Default to Ionicons if not found

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: group.name }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            {group.iconType === 'image' && group.iconSource && (
              <Text style={{ color: '#888' }}>Image Icon PlaceHolder</Text>
            )}
            {group.iconType === 'vector' && group.iconName && (
              React.createElement(ActualIconSet, { 
                name: group.iconName,
                size: 60,
                color: group.iconColor || '#555',
              })
            )}
          </View>
          <Text style={styles.groupName}>{group.name}</Text>
        </View>

        <View style={styles.detailCard}>
          <Text style={styles.cardTitle}>Members</Text>
          {group.members.length > 0 ? (
            group.members.map((member, index) => (
              <Text key={index} style={styles.memberText}>
                <Ionicons name="person-circle-outline" size={16} color="#777" /> {member}
              </Text>
            ))
          ) : (
            <Text style={styles.emptyMembersText}>No members in this group yet.</Text>
          )}
        </View>

        <View style={styles.detailCard}>
          <Text style={styles.cardTitle}>Group ID</Text>
          <Text style={styles.cardText}>{group.id}</Text>
        </View>

        <View style={styles.detailCard}>
          <Text style={styles.cardTitle}>Additional Information</Text>
          <Text style={styles.cardText}>This is where more group-specific information would go, like shared activities, notes, or events.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const availableIcons = [
  { name: 'people-outline', set: Ionicons, color: '#4A90E2' },
  { name: 'book-outline', set: Ionicons, color: '#50E3C2' },
  { name: 'desktop-outline', set: Ionicons, color: '#7B68EE' },
  { name: 'family-restroom', set: MaterialCommunityIcons, color: '#FF6347' },
  { name: 'gamepad-variant-outline', set: MaterialCommunityIcons, color: '#DA70D6' },
  { name: 'handshake', set: FontAwesome5, color: '#3CB371' },
  { name: 'food-outline', set: MaterialCommunityIcons, color: '#FFD700' },
  { name: 'compass-outline', set: Ionicons, color: '#8A2BE2' },
  { name: 'star-outline', set: Ionicons, color: '#FF8C00' },
];


const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#888',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  groupName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  detailCard: {
    backgroundColor: '#fff',
    width: '100%',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 5,
  },
  cardText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  memberText: {
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  emptyMembersText: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
  },
});