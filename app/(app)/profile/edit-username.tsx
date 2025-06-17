import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { updateUsername } from '../../../services/authService';
import { auth } from '../../../services/firebaseConfig';

export default function EditUsernameScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ currentUsername?: string; userId?: string }>();
    const [newUsername, setNewUsername] = useState('');
    const [originalUsername, setOriginalUsername] = useState(params.currentUsername || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (params.currentUsername) {
            setNewUsername(params.currentUsername);
            setOriginalUsername(params.currentUsername);
        }
    }, [params.currentUsername]);

    const handleUpdateUsername = async () => {
        if (!newUsername.trim()) {
            setError('Username cannot be empty.');
            return;
        }
        if (newUsername.trim().length < 3) {
            setError('Username must be at least 3 characters long.');
            return;
        }
        if (newUsername.trim() === originalUsername) {
            router.back();
            return;
        }
        setError('');
        setIsLoading(true);
         
        const currentUser = auth.currentUser;
        if (!currentUser) {
            Alert.alert('Error', 'No active user session. Please log in again.');
            setIsLoading(false);
            router.replace('/(auth)/login');
            return;
        }

        const response = await updateUsername(currentUser.uid, newUsername.trim());
        if (response.success) {
            router.back();
        } else {
            setError(response.error || 'Failed to update username');
        }  
        setIsLoading(false);
    };

    const isUsernameUnchanged = newUsername.trim() === originalUsername;

    return (
        <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        
        <View style={styles.container}>
            <Text style={styles.label}>New Username:</Text>
            <TextInput
            style={styles.input}
            value={newUsername}
            onChangeText={setNewUsername}
            placeholder="Enter new username"
            autoCapitalize="none"
            autoCorrect={false}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity 
                onPress={handleUpdateUsername} 
                style={styles.saveButtonTouchable} 
                disabled={isLoading || isUsernameUnchanged}>
            <LinearGradient
                colors={(isLoading || isUsernameUnchanged) ? ['#ccc', '#aaa'] : ['#ea4080', '#FFC174']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.gradient}
            >
                {isLoading ? (
                <ActivityIndicator color="#fff" />
                ) : (
                <Text style={styles.saveButtonText}>SAVE CHANGES</Text>
                )}
            </LinearGradient>
            </TouchableOpacity>
        </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 30,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
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
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
});