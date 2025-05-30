import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { UserProfile } from '../../services/authService';
import { auth, db } from '../../services/firebaseConfig';

export default function ProfileScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<Partial<UserProfile>>({
    username: '',
    email: '',
  }); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchuserData = async () => {
      setIsLoading(true);
      const currentUser = auth.currentUser;

      if (currentUser) {
        let fetchedUsername = currentUser.displayName || '';
        let fetchedEmail = currentUser.email || '';
      
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const firestoreProfile = userDoc.data() as UserProfile;
            fetchedUsername = firestoreProfile.username || fetchedUsername;
            fetchedEmail = firestoreProfile.email || fetchedEmail;
          } 
        } catch (error) {
          console.error('Error fetching user data:', error);
          Alert.alert('Error', 'Could not fetch user data.');
        }

        setUserData({
          username: fetchedUsername,
          email: fetchedEmail,
        });
      } else {
        console.warn('No user is currently signed in.');
        Alert.alert('Error', 'No user is currently signed in.');
        router.replace('/(auth)/login'); // redirect to login if no user
      }
      setIsLoading(false);
    };
    fetchuserData();
  }, []);

  const handleEditUsername = () => {
    console.log('Navigate to Edit Username screen');
    // TODO: edit username screen 
    Alert.alert("Edit Username", "Navigation to edit username screen placeholder.");
  };

  const handleChangePreferences = () => {
    console.log('Navigate to Dietary Preferences');
    router.push({
      pathname: './preferences',
      params: { isOnboarding: 'false' },
    }); 
  };

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          onPress: async () => {
            try {
              await signOut(auth);
              console.log("ProfileScreen: User logged out successfully from Firebase via signOut.");
            } catch (error) {
              console.error("ProfileScreen: Error logging out: ", error);
              Alert.alert("Error", "Could not log out. Please try again.");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

/* delete account functionality 
  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: () => {
            console.log("User account deletion initiated");
            // TODO: Implement actual account deletion logic (API call)
            // After deletion, navigate to the auth flow or initial screen
            router.replace('/(auth)/login');
          },
          style: "destructive",
        },
      ]
    );
  };
  */

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.profileHeader}>
          {/*} <Image source={{ uri: userData.profilePictureUrl }} style={styles.profilePicture} /> */}
          <Text style={styles.username}>{userData.username}</Text>
          <Text style={styles.email}>{userData.email}</Text>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <TouchableOpacity style={styles.menuItem} onPress={handleEditUsername}>
            <Ionicons name="person-outline" size={22} color="#555" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Edit Username</Text>
            <Ionicons name="chevron-forward" size={22} color="#ccc" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleChangePreferences}>
            <Ionicons name="restaurant-outline" size={22} color="#555" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Edit Dietary Preferences</Text>
            <Ionicons name="chevron-forward" size={22} color="#ccc" />
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <MaterialIcons name="logout" size={22} color="#555" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Log Out</Text>
          </TouchableOpacity>
        </View>
        {/* exclude delete account functionality for now
        <View style={styles.dangerZone}>
          <TouchableOpacity
            style={[styles.menuItem, styles.deleteButton]}
            onPress={handleDeleteAccount}
          >
            <MaterialIcons name="delete-forever" size={22} color="#D9534F" style={styles.menuIcon} />
            <Text style={[styles.menuItemText, styles.deleteButtonText]}>Delete Account</Text>
          </TouchableOpacity>
        </View>
        */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f4f8', // Light grey background
  },
  container: {
    paddingBottom: 30, // Space at the bottom
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: 'white', // White background for header section
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 20,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50, // Circular image
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#E15A7C', 
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  email: {
    fontSize: 16,
    color: '#777',
    marginTop: 4,
  },
  menuSection: {
    marginBottom: 20,
    backgroundColor: 'white', 
    marginHorizontal: 15,
    overflow: 'hidden', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    marginRight: 15,
  },
  menuItemText: {
    flex: 1, 
    fontSize: 16,
    color: '#444',
  },
  dangerZone: {
    marginTop: 20,
    marginHorizontal: 15,
  },
  deleteButton: {
    backgroundColor: 'white', 
    borderBottomWidth: 0, 
    borderRadius: 8, 
  },
  deleteButtonText: {
    color: '#D9534F', 
    fontWeight: '600',
  },
});
