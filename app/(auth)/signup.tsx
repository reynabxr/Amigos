import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function signup() {
    const router = useRouter(); // Add this if not already present
// ...

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Create Account / Signup Screen</Text>
      {/* Your signup form UI will go here */}
      <TouchableOpacity onPress={() => router.push('/username')}>
  <Text>View Terms</Text>
</TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20 },
});