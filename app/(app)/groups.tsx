import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../../services/firebaseConfig';

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

const GroupItem: React.FC<GroupData> = ({ id, name, members, iconType, iconName, iconSet: IconSet, iconColor, iconSource }) => {
  const router = useRouter();
  const handleGroupPress = () => {
    router.push(`/groups/${id}` as any);
  };

  return (
    <TouchableOpacity style={styles.groupItem} onPress={handleGroupPress}>
      <View style={styles.iconContainer}>
        {iconType === 'image' && iconSource && (<Image source={iconSource} style={styles.groupIconImage} />)}
        {iconType === 'vector' && IconSet && iconName && (
          React.createElement(IconSet, {
            name: iconName,
            size: 28,
            color: iconColor || '#555',
          })
        )}
      </View>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{name}</Text>
        <Text style={styles.groupMembers}>Members: {members.join(', ')}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default function Groups() {
  const router = useRouter();
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGroups = useCallback(() => {
    const user = auth.currentUser;
    if (!user) {
      console.warn('No user is currently signed in.');
      setIsLoading(false);
      return;
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
      snapshot.forEach(doc => {
        const data = doc.data();
        fetchedGroups.push({
          id: doc.id,
          name: data.name,
          members: data.members,
          iconType: data.iconType,
          iconName: data.iconName,
          iconSet: Ionicons,
          iconColor: data.iconColor,
          iconSource: data.iconSource,
          ownerId: data.ownerId,
          createdAt: data.createdAt,
        });
      });
      setGroups(fetchedGroups);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching groups:', error);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
      return () => {};
    }, [fetchGroups])
  );

  const handleCreateGroup = () => {
    console.log('Create New Group pressed');
    router.push('/group-creation');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container}>
        {groups.length > 0 ? (
          groups.map(group => <GroupItem key={group.id} {...group} />)
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
