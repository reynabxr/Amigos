import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
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


interface GroupData { 
  id: string;
  name: string;
  members: string[];
  iconType: 'vector' | 'image'; 
  iconName?: any;
  iconSet?: IconSetType;
  iconColor?: string;
  iconSource?: any;
}

// Sample Data (to be replaced with actual data)
const groupsData: GroupData[] = [ 
  {
    id: '1',
    name: 'Tan Family',
    members: ['Jake', 'Amy', 'Cassandra'],
    iconType: 'vector', 
    iconName: 'people-outline',
    iconSet: Ionicons,
    iconColor: '#4A90E2',
  },
  {
    id: '2',
    name: 'Study Group',
    members: ['Jun Jie', 'Tom', 'Samantha'],
    iconType: 'vector',
    iconName: 'book-outline',
    iconSet: Ionicons,
    iconColor: '#50E3C2',
  },
  {
    id: '3',
    name: 'Intern Friends',
    members: ['Yong Qi', 'Celina', 'Joy'],
    iconType: 'vector',
    iconName: 'desktop-outline',
    iconSet: Ionicons,
    iconColor: '#7B68EE',
  },
];

type IconSetType = typeof Ionicons | typeof MaterialCommunityIcons | typeof FontAwesome5;

const GroupItem: React.FC<GroupData> = ({ name, members, iconType, iconName, iconSet: IconSet, iconColor, iconSource }) => {
  return (
    <TouchableOpacity style={styles.groupItem}>
      <View style={styles.iconContainer}>
        {iconType === 'image' && iconSource && <Image source={iconSource} style={styles.groupIconImage} />}
        {iconType === 'vector' && IconSet && iconName && (
          <IconSet name={iconName} size={28} color={iconColor || '#555'} />
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

  const handleCreateGroup = () => {
    console.log('Create New Group pressed');
    // TODO: Create group page
    alert('Create New Group!');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container}>
        {groupsData.length > 0 ? (
          groupsData.map(group => <GroupItem key={group.id} {...group} />)
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
  container: { // for ScrollView's content
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
    paddingVertical: 15, // Padding around the button
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
