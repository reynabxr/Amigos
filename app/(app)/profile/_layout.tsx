import { Stack } from 'expo-router';
import React from 'react';

export default function ProfileStackLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          headerTitle: 'My Profile',
        }}
      />
      <Stack.Screen
        name="edit-username"
        options={{
          title: 'Edit Username',
        }}
      />
    </Stack>
  );
}