import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { firebaseSignIn } from '../../services/authService';

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginPress = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    
    // Basic email validation 
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    // call firebase sign in service
    try {
      const response = await firebaseSignIn(email.trim(), password.trim());
      if (response.success && response.user) {
        router.replace('../(app)/home'); // navigate to home screen
      } else {
        // handle errors
        let errorMessage = response.message || response.error || 'Login failed. Please try again.';
        if (response.message === 'auth/user-not-found' || response.message === 'auth/wrong-password' || response.message === 'auth/invalid-credential') {
          errorMessage = 'Invalid email or password. Please try again.';
        }
        Alert.alert('Login Failed', errorMessage);
      }
    } catch (error: any) {
      console.error('Login Error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpPress = () => {
    router.push('/signup'); 
  };

  return (
    <SafeAreaView style={styles.screenContainer}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={"padding"}
        style={styles.keyboardAvoidingContainer}
        keyboardVerticalOffset = {0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.centeredView}>
              <View style={styles.card}>
                <Text style={styles.signInTitle}>Sign In</Text>

                <View style={styles.signUpPromptContainer}>
                  <Text style={styles.notRegisteredText}>Not registered yet? </Text>
                  <TouchableOpacity onPress={handleSignUpPress}>
                    <Text style={styles.signUpLink}>Sign Up</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                />

                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                />

                <TouchableOpacity style={styles.loginButton} onPress={handleLoginPress} disabled={isLoading}>
                  {isLoading ? (<ActivityIndicator color="#fff" />) : (
                    <Text style={styles.loginButtonText}>SIGN IN</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#ec787c', 
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  centeredView: {
    justifyContent: 'center', 
    alignItems: 'center',    
    padding: 20, 
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 25, 
    width: '100%', 
    maxWidth: 400, 
    shadowColor: '#000', 
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  
  },
  signInTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  signUpPromptContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  notRegisteredText: {
    fontSize: 14,
    color: '#666',
  },
  signUpLink: {
    fontSize: 14,
    color: '#007AFF', 
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0', 
    marginBottom: 25,
  },
  label: {
    fontSize: 14,
    color: '#444',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#f9f9f9', 
    borderWidth: 1,
    borderColor: '#ccc', 
    borderRadius: 6,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
    color: '#333',
  },
  loginButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#EA4080', 
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10, 
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoginPage;
