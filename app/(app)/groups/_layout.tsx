import { Stack } from 'expo-router';
import React from 'react';

export default function GroupStackLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          headerTitle: 'My Groups',
        }}
      />
      <Stack.Screen
        name="creation"
        options={{
            title: 'Create New Group',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
        }}
      />
    </Stack>
  );
}