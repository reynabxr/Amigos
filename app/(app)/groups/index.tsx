import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { collection, doc, getDoc, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { auth, db } from '../../../services/firebaseConfig';

export interface AvailableIcon {
  name: string;
  set: IconSetType;
  color: string;
}

export interface GroupData { 
  id: string;
  name: string;
  members: string[];
  iconType: 'vector' | 'image'; 
  iconName?: any;
  iconSet?: IconSetType;
  iconColor?: string;
  iconSource?: any;
  ownerId: string;
  createdAt: number;
}

export type IconSetType = typeof Ionicons | typeof MaterialCommunityIcons | typeof FontAwesome5;

export const availableIcons: AvailableIcon[] = [
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

export const getIconSetComponent = (iconName: string): IconSetType => {
  const mapping = availableIcons.find(item => item.name === iconName);
  return mapping ? mapping.set : Ionicons;
};

const GroupItem: React.FC<{ group: GroupData; memberNames: { [uid: string]: string } }> = ({ group, memberNames }) => {
  const router = useRouter();
  const handleGroupPress = () => {
    router.push({pathname: "/groups/[id]", params: { id: group.id }
    });
  };

  const ActualIconSet = group.iconType === 'vector' && group.iconName ? getIconSetComponent(group.iconName) : Ionicons;
  
  const displayMembers = [...group.members]
    .sort((a, b) => {
      if (a === auth.currentUser?.uid) return -1;
      if (b === auth.currentUser?.uid) return 1;
      return 0;
    })
    .map(uid => {
      if (uid === auth.currentUser?.uid) {
        return 'You';
      }
      return memberNames[uid] || '...';
    })
    .join(', ');

  return (
    <TouchableOpacity style={styles.groupItem} onPress={handleGroupPress}>
      <View style={styles.iconContainer}>
        {group.iconType === 'image' && group.iconSource && (<Image source={group.iconSource} style={styles.groupIconImage} />)}
        {group.iconType === 'vector' && group.iconName && (
          React.createElement(ActualIconSet, {
            name: group.iconName,
            size: 28,
            color: group.iconColor || '#555',
          })
        )}
      </View>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{group.name}</Text>
        <Text style={styles.groupMembers}>Members: {displayMembers}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default function Groups() {
  const router = useRouter();
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [memberNames, setMemberNames] = useState<{ [uid: string]: string }>({});

  const fetchMemberNames = async (uids: string[]) => {
    if (uids.length === 0) return;
    const uniqueUids = [...new Set(uids)]; 
    const newNames: { [uid: string]: string } = {};

    for (const uid of uniqueUids) {
      if (memberNames[uid]) continue;
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          newNames[uid] = userDoc.data().username || userDoc.data().email || 'Unknown';
        }
      } catch (error) {
        console.error(`Failed to fetch name for UID ${uid}:`, error);
      }
    }

    if (Object.keys(newNames).length > 0) {
      setMemberNames(prev => ({ ...prev, ...newNames }));
    }
  };

  const fetchGroups = useCallback(() => {
    const user = auth.currentUser;
    if (!user) {
      console.warn('No user is currently signed in.');
      setGroups([]);
      setIsLoading(false);
      return () => {};
    }
    setIsLoading(true);
    const groupsRef = collection(db, 'groups');
    const q = query(
      groupsRef,
      where('members', 'array-contains', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedGroups: GroupData[] = [];
      const allMemberUids: string[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        fetchedGroups.push({
          id: doc.id,
          name: data.name,
          members: data.members || [],
          iconType: data.iconType || 'vector',
          iconName: data.iconName,
          iconColor: data.iconColor,
          iconSource: data.iconSource,
          ownerId: data.ownerId,
          createdAt: data.createdAt,
        } as GroupData);
        allMemberUids.push(...(data.members || []));
      });
      setGroups(fetchedGroups);
      fetchMemberNames(allMemberUids);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching groups:', error);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = fetchGroups();
      return () => {unsubscribe();};
    }, [fetchGroups])
  );

  const handleCreateGroup = () => {
    console.log('Create New Group pressed');
    router.push('/groups/creation');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E15A7C" />
            <Text style={styles.loadingText}>Loading groups...</Text>
          </View>
        ) : groups.length > 0 ? (
          groups.map(group => <GroupItem key={group.id} group={group} memberNames={memberNames} />)
        ) : (
          <Text style={styles.emptyText}>You are not part of any groups yet.</Text>
        )}
      </ScrollView>
      <View style={styles.createGroupButtonContainer}>
        <TouchableOpacity style={styles.createGroupButton} onPress={handleCreateGroup}>
          <LinearGradient
            colors={['#ea4080', '#FFC174']} 
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.gradient}
          >
            <Text style={styles.createGroupButtonText}>+ Create New Group</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 150,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#888',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 20, 
    paddingBottom: 20, 
    flexGrow: 1, 
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  groupIconImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 3,
  },
  groupMembers: {
    fontSize: 14,
    color: '#777777',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    paddingVertical: 30,
    fontSize: 16,
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  createGroupButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1, 
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff', 
  },
  createGroupButton: {
    borderRadius: 25, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  gradient: {
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 25, 
  },
  createGroupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
