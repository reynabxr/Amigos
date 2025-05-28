import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginPress = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    console.log('Login attempt with:', { email, password });
    // TODO: Implement actual login logic here (e.g., API call)
    // If successful, navigate to the main app:
    // router.replace('/(app)/home'); // Example path
    Alert.alert('Login Attempt', `Email: ${email}, Password: ${password}`);
  };

  const handleSignUpPress = () => {
    router.push('/signup'); 
  };

  return (
    <SafeAreaView style={styles.screenContainer}>
      <StatusBar barStyle="dark-content" />
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

          <TouchableOpacity style={styles.loginButton} onPress={handleLoginPress}>
            <Text style={styles.loginButtonText}>SIGN IN</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#ec787c', 
  },
  centeredView: {
    flex: 1,
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
    backgroundColor: '#fff', 
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
