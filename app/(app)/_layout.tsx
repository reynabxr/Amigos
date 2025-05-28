
import { Stack } from 'expo-router';
import React from 'react';

export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index" 
        options={{
          headerShown: false, 
        }}
      />
      <Stack.Screen name="home" options={{ title: 'Home' }} />
    </Stack>
  );
}
