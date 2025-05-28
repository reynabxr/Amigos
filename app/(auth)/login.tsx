import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function login() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Google Sign-In Screen Placeholder</Text>
      {/* Actual Google Sign-In UI and logic will go here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20 },
});