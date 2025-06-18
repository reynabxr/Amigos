import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';

import { collection, doc, getDoc } from 'firebase/firestore';
import { GroupData, IconSetType, availableIcons, getIconSetComponent } from '.';
import { auth, db } from '../../../services/firebaseConfig';

export default function GroupDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id;
  const [group, setGroup] = useState<GroupData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [memberDisplayNames, setMemberDisplayNames] = useState<{ [uid: string]: string }>({});

  const handleManageGroupPress = useCallback(() => {
    if (group?.id) {
      router.push({ pathname: '/groups/[id]/manage', params: { id: group.id } });
    }
  }, [group, router]);

  const fetchMemberDisplayNames = useCallback(async (memberUids: string[]) => {
    const names: { [uid: string]: string } = {};
    if (memberUids.length === 0) {
      setMemberDisplayNames({});
      return;
    }

    try {
      const usersRef = collection(db, 'users');
      const userQueries = memberUids.map(uid => getDoc(doc(usersRef, uid)));
      const userDocs = await Promise.all(userQueries);

      userDocs.forEach(userDoc => {
        if (userDoc.exists()) {
          const userData = userDoc.data();
          names[userDoc.id] = userData.username || userData.email || `User ${userDoc.id.substring(0, 4)}...`;
        } else {
          names[userDoc.id] = `Unknown User (${userDoc.id.substring(0, 4)}...)`;
        }
      });
      setMemberDisplayNames(names);
    } catch (error) {
      console.error('Error fetching member display names:', error);
    }
  }, []);

  useEffect(() => {
    if (!id) {
        setIsLoading(false);
        return;
    }
    const fetchGroupDetails = async () => {
      setIsLoading(true);
      try {
        const docRef = doc(db, 'groups', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const fetchedGroup: GroupData = {
            id: docSnap.id,
            name: data.name,
            members: data.members || [],
            iconType: data.iconType || 'vector',
            iconName: data.iconName,
            iconColor: data.iconColor,
            iconSource: data.iconSource,
            ownerId: data.ownerId,
            createdAt: data.createdAt,
            iconSet: getIconSetComponent(data.iconName),
          };
          setGroup(fetchedGroup);
          await fetchMemberDisplayNames(fetchedGroup.members);
        } else {
          console.warn('No such group document!', id);
          router.replace('/groups');
        }
      } catch (error) {
        console.error('Error fetching group details:', error);
        setGroup(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGroupDetails();
  }, [id, fetchMemberDisplayNames, router]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <ActivityIndicator size="large" color="#E15A7C" />
        <Text style={styles.loadingText}>Loading Group Details...</Text>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Error' }} />
        <Text style={styles.loadingText}>Group not found.</Text>
      </SafeAreaView>
    );
  }
  
  const ActualIconSet = group.iconType === 'vector' && group.iconName ? getIconSetComponent(group.iconName) : Ionicons;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: group.name }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            {group.iconType === 'image' && group.iconSource && (
              <Text style={{ color: '#888', fontSize: 12 }}>Image Icon</Text>
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
            group.members.map((memberUid, index) => (
              <Text key={index} style={styles.memberText}>
                <Ionicons name="person-circle-outline" size={16} color="#777" /> {memberDisplayNames[memberUid] || `User ${memberUid.substring(0, 4)}...`}
              </Text>
            ))
          ) : (
            <Text style={styles.emptyMembersText}>No members in this group yet.</Text>
          )}
        </View>
        {auth.currentUser?.uid && group.members.includes(auth.currentUser.uid) && (
          <TouchableOpacity
            style={styles.manageButtonTouchable}
            onPress={handleManageGroupPress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#ea4080', '#FFC174']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.manageButtonGradient}
            >
              <Text style={styles.manageButtonText}>Manage Group</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#888',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  manageButtonTouchable: {
  marginTop: 20,
  borderRadius: 25,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 3,
  elevation: 3,
  width: '100%',
},
manageButtonGradient: {
  paddingVertical: 15,
  alignItems: 'center',
  borderRadius: 25,
  width: '100%',
},
manageButtonText: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 16,
},
});