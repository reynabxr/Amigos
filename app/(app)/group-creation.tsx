import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Button,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { addDoc, collection } from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';

const amigos = [
  { id: 'a1', name: 'Jake', username: 'jake_amigo' },
  { id: 'a2', name: 'Amy', username: 'amy_friend' },
  { id: 'a3', name: 'Jun Jie', username: 'jj_cool' },
  { id: 'a4', name: 'Tom', username: 'tom_cat' },
  { id: 'a5', name: 'Samantha', username: 'sam_star' },
  { id: 'a6', name: 'Yong Qi', username: 'yq_coder' },
  { id: 'a7', name: 'Celina', username: 'cel_sun' },
  { id: 'a8', name: 'Joy', username: 'joy_ful' },
];

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

export default function GroupCreationScreen() {
    const navigation = useNavigation();
    const localSearchParams = useLocalSearchParams();
    const addGroupCallback = localSearchParams.addGroupCallback;

    const [groupName, setGroupName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState(availableIcons[0]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

    const handleCreateGroup = async () => {
        const user = auth.currentUser;
        if (!user) {
        Alert.alert('Error', 'You must be logged in to create a group.');
        return;
        }

        if (!groupName.trim()) {
            Alert.alert('Error', 'Please enter a group name.');
            return;
        }

        const memberUids: string[] = [user.uid];
        const finalMembersForFirestore = [...new Set([...selectedMembers, user.displayName || user.email || 'Current User'])];

        const newGroupData = {
            name: groupName.trim(),
            members: [user.uid, ...selectedMembers],
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
    };

    const toggleMemberSelection = (memberId: string) => {
        setSelectedMembers((prevSelected) => {
            if (prevSelected.includes(memberId)) {
                return prevSelected.filter(id => id !== memberId);
            } else {
                return [...prevSelected, memberId];
            }
        });
    };

    return (
        <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Create New Group' }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.label}>Group Name:</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Weekend Warriors"
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
        <View style={styles.membersContainer}>
          {amigos.map(amigo => (
            <TouchableOpacity
              key={amigo.id}
              style={[
                styles.memberChip,
                selectedMembers.includes(amigo.name) && styles.selectedMemberChip,
              ]}
              onPress={() => toggleMemberSelection(amigo.name)}
            >
              <Text
                style={[
                  styles.memberChipText,
                  selectedMembers.includes(amigo.name) && styles.selectedMemberChipText,
                ]}
              >
                {amigo.name}
              </Text>
            </TouchableOpacity>
          ))}
          {selectedMembers.length === 0 && (
            <Text style={styles.noMembersSelectedText}>
              Select existing Amigos to invite!
            </Text>
          )}
        </View>

        <TouchableOpacity style={styles.createButton} onPress={handleCreateGroup}>
          <Text style={styles.createButtonText}>Create Group</Text>
        </TouchableOpacity>
      </ScrollView>

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
  scrollContent: {
    padding: 20,
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
  membersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
  },
  memberChip: {
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    margin: 5,
  },
  selectedMemberChip: {
    backgroundColor: '#E15A7C',
  },
  memberChipText: {
    color: '#333',
    fontSize: 14,
  },
  selectedMemberChipText: {
    color: '#fff',
  },
  noMembersSelectedText: {
    color: '#888',
    fontStyle: 'italic',
    padding: 10,
  },
  createButton: {
    backgroundColor: '#E15A7C',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonText: {
    color: 'white',
    fontSize: 18,
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

