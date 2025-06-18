import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { addDoc, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { GroupData } from '.';
import { auth, db } from '../../../services/firebaseConfig';

interface AppUser {
  id: string;
  username: string;
  email: string;
}

const availableIcons = [
  { name: 'people-outline', set: Ionicons, color: '#4A90E2' },
  { name: 'book-outline', set: Ionicons, color: '#50E3C2' },
  { name: 'desktop-outline', set: Ionicons, color: '#7B68EE' },
  { name: 'gamepad-variant-outline', set: MaterialCommunityIcons, color: '#DA70D6' },
  { name: 'handshake', set: FontAwesome5, color: '#3CB371' },
  { name: 'food-outline', set: MaterialCommunityIcons, color: '#FFD700' },
  { name: 'compass-outline', set: Ionicons, color: '#8A2BE2' },
  { name: 'star-outline', set: Ionicons, color: '#FF8C00' },
];

export default function GroupCreationScreen() {
    const navigation = useNavigation();
    const router = useRouter();

    const [groupName, setGroupName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState(availableIcons[0]);
    const [modalVisible, setModalVisible] = useState(false);

    const [selectedMemberUids, setSelectedMemberUids] = useState<string[]>([]);
    const [selectedMemberNames, setSelectedMemberNames] = useState<{ [uid: string]: string }>({});

    const [searchQuery, setSearchQuery] = useState('');
    const [allUsers, setAllUsers] = useState<AppUser[]>([]);
    const [fetchingUsers, setFetchingUsers] = useState(false);

    useEffect(() => {
      const fetchAllUsers = async () => {
        setFetchingUsers(true);
        try {
          const usersCollectionRef = collection(db, 'users');
          const q = query(usersCollectionRef, orderBy('username'));
          const querySnapshot = await getDocs(q);
          const fetchedUsers: AppUser[] = [];
          querySnapshot.forEach(doc => {
            const userData = doc.data();
            fetchedUsers.push({
              id: doc.id,
              username: userData.username || userData.email || doc.id,
              email: userData.email,
            });
          });
          setAllUsers(fetchedUsers);
        } catch (error) {
          console.error('Error fetching all users:', error);
          Alert.alert('Error', 'Failed to load user list.');
        } finally {
          setFetchingUsers(false);
        }
      };
      fetchAllUsers();
    }, []);

    const filteredUsers = allUsers.filter(user =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !selectedMemberUids.includes(user.id) && 
      user.id !== (auth.currentUser?.uid || '') 
    );

    const handleCreateGroup = useCallback(async () => {
        const user = auth.currentUser;
        if (!user) {
        Alert.alert('Error', 'You must be logged in to create a group.');
        return;
        }

        if (!groupName.trim()) {
            Alert.alert('Error', 'Please enter a group name.');
            return;
        }

        const finalMemberUids: string[] = [...new Set([user.uid, ...selectedMemberUids])];

        const newGroupData: Omit<GroupData, 'id' | 'iconSet'> = {
          name: groupName.trim(),
          members: finalMemberUids,
          iconType: 'vector',
          iconName: selectedIcon.name,
          iconColor: selectedIcon.color,
          ownerId: user.uid,
          createdAt: Date.now(),
        };

        try {
            await addDoc(collection(db, 'groups'), newGroupData);
            Alert.alert('Success', `${groupName} group created!`);
            router.replace('/(app)/groups');
        } catch (error) {
            console.error('Error creating group:', error);
            Alert.alert('Error', 'Failed to create group. Please try again.');
        }
    }, [groupName, selectedIcon, selectedMemberUids, router]);  

    const toggleMemberSelection = useCallback((userToToggle: AppUser) => {
    setSelectedMemberUids(prevSelectedUids => {
      if (prevSelectedUids.includes(userToToggle.id)) {
        setSelectedMemberNames(prevNames => {
            const newNames = { ...prevNames };
            delete newNames[userToToggle.id];
            return newNames;
        });
        return prevSelectedUids.filter(uid => uid !== userToToggle.id);
      } else {
        setSelectedMemberNames(prevNames => ({
            ...prevNames,
            [userToToggle.id]: userToToggle.username,
        }));
        return [...prevSelectedUids, userToToggle.id];
      }
    });
  }, []);

    const renderListHeader = useMemo(() => (
      <>
        <Text style={styles.label}>Group Name:</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Lunch Buddies"
          value={groupName}
          onChangeText={setGroupName}
        />

        <Text style={styles.label}>Group Icon:</Text>
        <TouchableOpacity style={styles.iconSelectionButton} onPress={() => setModalVisible(true)}>
          <View style={styles.iconContainer}>
            {React.createElement(selectedIcon.set, {
              name: selectedIcon.name,
              size: 30,
              color: selectedIcon.color,
            })}
          </View>
          <Text style={styles.iconSelectionText}>Change Icon</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" style={styles.chevronIcon} />
        </TouchableOpacity>

        <Text style={styles.label}>Invite Members:</Text>
        <View style={styles.selectedMembersDisplay}>
            {selectedMemberUids.length > 0 ? (
                selectedMemberUids.map(uid => {
                    const selectedUser = allUsers.find(u => u.id === uid);
                    const displayName = selectedUser ? selectedUser.username : `User ${uid.substring(0, 4)}...`;

                    return (
                        <View key={uid} style={styles.memberChip}>
                            <Text style={styles.memberChipText}>{displayName}</Text>
                            <TouchableOpacity onPress={() => toggleMemberSelection(selectedUser!)} style={styles.removeMemberButton}>
                              <Ionicons name="close-circle" size={16} color="gray" />
                            </TouchableOpacity>
                        </View>
                    );
                })
            ) : (
                <Text style={styles.noMembersSelectedText}>
                    No members invited yet.
                </Text>
            )}
        </View>
        
        {/* search input for members */}
        <TextInput
          style={styles.input}
          placeholder="Search your friends by their username..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </>
    ), [groupName, selectedIcon, searchQuery, selectedMemberUids, allUsers, toggleMemberSelection]);

    const renderListFooter = useMemo(() => (
        <TouchableOpacity
          onPress={handleCreateGroup}
          style={styles.createButtonTouchable}
      >
          <LinearGradient
              colors={['#ea4080', '#FFC174']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.gradient}
          >
            <Text style={styles.createButtonText}>CREATE</Text>
          </LinearGradient>
      </TouchableOpacity>
    ), [handleCreateGroup]);

    return (
      <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Create New Group' }} />

        {/* search results list */}
        <FlatList
        style={styles.flatListContainer}
        contentContainerStyle={styles.scrollContent}
        data={filteredUsers.slice(0, 5)}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderListFooter}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.searchUserItem} onPress={() => toggleMemberSelection(item)}>
            <Text style={styles.searchUserItemText}>{item.username}</Text>
            <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={() => (
          <View style={styles.searchUserListContainer}>
            {fetchingUsers ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : searchQuery.length > 0 ? (
              <Text style={styles.noSearchResultsText}>No Amigos found with that name.</Text>
            ) : (
              <Text style={styles.noSearchResultsText}>Start typing to search for Amigos.</Text>
            )}
          </View>
        )}
        keyboardShouldPersistTaps="handled"
      />

      {/* icon selection modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select an Icon</Text>
            <FlatList
              data={availableIcons}
              numColumns={4}
              keyExtractor={(item, index) => `${item.name}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.iconOption,
                    selectedIcon.name === item.name && styles.selectedIconOption,
                  ]}
                  onPress={() => {
                    setSelectedIcon(item);
                    setModalVisible(false);
                  }}
                >
                  {React.createElement(item.set, {
                    name: item.name,
                    size: 35,
                    color: item.color,
                  })}
                </TouchableOpacity>
              )}
            />
            <Button title="Close" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  flatListContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  iconSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e9e9e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  iconSelectionText: {
    flex: 1,
    fontSize: 16,
    color: '#555',
  },
  chevronIcon: {
    marginLeft: 10,
  },
  selectedMembersDisplay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    minHeight: 40,
    paddingVertical: 5,
    paddingHorizontal: 5,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
  },
  memberChip: {
    flexDirection: 'row',
    backgroundColor: '#E15A7C',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    margin: 4,
    alignItems: 'center',
  },
  memberChipText: {
    color: '#fff',
    fontSize: 14,
    marginRight: 5,
  },
  removeMemberButton: {
    marginLeft: 5,
  },
  noMembersSelectedText: {
    color: '#888',
    fontStyle: 'italic',
    padding: 10,
  },
  searchUserListContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    maxHeight: 200,
    overflow: 'hidden',
    marginBottom: 15,
  },
  searchUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  searchUserItemText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 15,
  },
  noSearchResultsText: {
    textAlign: 'center',
    paddingVertical: 15,
    color: '#888',
    fontStyle: 'italic',
  },
  createButtonTouchable: {
    marginTop: 20,
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
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  iconOption: {
    padding: 10,
    margin: 5,
    alignItems: 'center',
    justifyContent: 'center',
    width: '22%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  selectedIconOption: {
    borderWidth: 2,
    borderColor: '#E15A7C',
  },
});