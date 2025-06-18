import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
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
  View,
} from 'react-native';

import { collection, doc, getDoc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../../../services/firebaseConfig';
import { GroupData, IconSetType, availableIcons, getIconSetComponent} from '../index';

interface AppUser {
  id: string;
  username: string;
  email: string;
}

export default function ManageGroupScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [group, setGroup] = useState<GroupData | null>(null);
  const [groupName, setGroupName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(availableIcons[0]);
  const [modalVisible, setModalVisible] = useState(false);

  const [currentMemberUids, setCurrentMemberUids] = useState<string[]>([]);
  const [currentMemberNames, setCurrentMemberNames] = useState<{ [uid: string]: string }>({});

  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingGroup, setIsLoadingGroup] = useState(true);

  useEffect(() => {
    const fetchGroupData = async () => {
      if (!id) {
        setIsLoadingGroup(false);
        return;
      }
      setIsLoadingGroup(true);
      try {
        const docRef = doc(db, 'groups', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as GroupData;
          setGroup(data);
          setGroupName(data.name);
          const icon = availableIcons.find(i => i.name === data.iconName) || availableIcons[0];
          setSelectedIcon(icon);
          setCurrentMemberUids(data.members || []);
          const names = await fetchDisplayNamesForUids(data.members || []);
          setCurrentMemberNames(names);
        } else {
          router.replace('/groups');
        }
      } catch (error) {
        console.error('Error fetching group data:', error);
        router.replace('/groups');
      } finally {
        setIsLoadingGroup(false);
      }
    };
    fetchGroupData();
  }, [id]);

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
        Alert.alert('Error', 'Failed to load user list for member search.');
      } finally {
        setFetchingUsers(false);
      }
    };
    fetchAllUsers();
  }, []);

  const fetchDisplayNamesForUids = useCallback(async (uids: string[]) => {
    const names: { [uid: string]: string } = {};
    if (uids.length === 0) return names;
    const uniqueUids = [...new Set(uids)];

    for (const uid of uniqueUids) {
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          names[uid] = userDoc.data().username || `User ${uid.substring(0, 4)}...`;
        } else {
          names[uid] = `Unknown User (${uid.substring(0, 4)}...)`;
        }
      } catch (error) {
        console.error(`Failed to fetch name for UID ${uid}:`, error);
        names[uid] = `Error User (${uid.substring(0, 4)}...)`;
      }
    }
    return names;
  }, []);

  const filteredUsers = useMemo(() => {
    const currentUserUid = auth.currentUser?.uid || '';
    return allUsers.filter(user =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !currentMemberUids.includes(user.id) &&
      user.id !== currentUserUid 
    );
  }, [allUsers, searchQuery, currentMemberUids]);

  const handleToggleMember = useCallback((userToToggle: AppUser, type: 'add' | 'remove') => {
    setCurrentMemberUids(prevUids => {
      if (type === 'remove') {
        setCurrentMemberNames(prevNames => {
          const newNames = { ...prevNames };
          delete newNames[userToToggle.id];
          return newNames;
        });
        return prevUids.filter(uid => uid !== userToToggle.id);
      } else {
        setCurrentMemberNames(prevNames => ({
          ...prevNames,
          [userToToggle.id]: userToToggle.username,
        }));
        return [...prevUids, userToToggle.id];
      }
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Group name cannot be empty.');
      return;
    }
    if (!group || !id) {
      return;
    }

    setIsSaving(true);
    try {
      const docRef = doc(db, 'groups', id);
      await updateDoc(docRef, {
        name: groupName.trim(),
        iconName: selectedIcon.name,
        iconColor: selectedIcon.color || '#555',
        members: currentMemberUids,
      });
      Alert.alert('Success', 'Group updated successfully!');
      router.back();
    } catch (e) {
      console.error('Error updating group:', e);
      Alert.alert('Error', 'Failed to update group. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [id, groupName, selectedIcon, currentMemberUids, group]);

    const haveChanges =
        groupName.trim() !== (group?.name || '').trim() ||
        selectedIcon.name !== (group?.iconName || '') ||
        selectedIcon.color !== (group?.iconColor || '') ||
        JSON.stringify([...currentMemberUids].sort()) !== JSON.stringify([...(group?.members || [])].sort());
  
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

      <Text style={styles.label}>Manage Members:</Text>
      <View style={styles.selectedMembersDisplay}>
        {currentMemberUids.length > 0 ? (
          currentMemberUids.map(uid => {
            const isCurrentUser = uid === auth.currentUser?.uid;
            const displayName = currentMemberNames[uid] || (isCurrentUser ? 'You' : `User ${uid.substring(0, 4)}...`);
            return (
              <View key={uid} style={styles.memberChip}>
                <Text style={styles.memberChipText}>{displayName}</Text>
                {!isCurrentUser && (
                  <TouchableOpacity onPress={() => handleToggleMember(allUsers.find(u => u.id === uid)!, 'remove')} style={styles.removeMemberButton}>
                    <Ionicons name="close-circle" size={16} color="gray" />
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        ) : (
          <Text style={styles.noMembersSelectedText}>No members in this group.</Text>
        )}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Search and add Amigos by username..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
    </>
  ), [
    groupName,
    selectedIcon,
    currentMemberUids,
    currentMemberNames,
    searchQuery,
    allUsers,
    handleToggleMember,
  ]);

  const renderListFooter = useMemo(() => (
    <TouchableOpacity
        onPress={handleSave}
        style={styles.saveButtonTouchable}
        disabled={isSaving || !haveChanges}
    >
        <LinearGradient
            colors={(isSaving || !haveChanges) ? ['#ccc', '#aaa'] : ['#ea4080', '#FFC174']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.gradient}
        >
            {isSaving ? (
            <ActivityIndicator color="#fff" />
            ) : (
            <Text style={styles.saveButtonText}>SAVE CHANGES</Text>
            )}
        </LinearGradient>
    </TouchableOpacity>
  ), [handleSave, isSaving]);

  if (isLoadingGroup) {
    return (
      <SafeAreaView style={styles.safeAreaLoading}>
        <ActivityIndicator size="large" color="#E15A7C" />
        <Text style={styles.loadingText}>Loading group...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Manage Group' }} />

      <FlatList
        style={styles.flatListContainer}
        contentContainerStyle={styles.scrollContent}
        data={filteredUsers.slice(0, 5)}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderListFooter}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.searchUserItem} onPress={() => handleToggleMember(item, 'add')}>
            <Text style={styles.searchUserItemText}>{item.username}</Text>
            <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={() => (
          <View style={styles.emptySearchContainer}>
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
  safeAreaLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  emptySearchContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
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
  saveButtonTouchable: {
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
  saveButtonText: {
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#888',
  },
});