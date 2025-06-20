import { Stack } from 'expo-router';
import React from 'react';
import AuthState from '../../components/AuthState'

export default function AuthLayout() {
  return (
    <AuthState>
      <Stack>
        <Stack.Screen
          name="index" 
          options={{
            headerShown: false,
            headerLeft: () => null,
            headerBackVisible: false,
          }}
        />
        <Stack.Screen
          name="login" 
          options={{
            title: 'Log In',
            headerShown: true,
            headerLeft: () => null,
            headerBackVisible: false,
          }}
        />
        <Stack.Screen
          name="signup" 
          options={{
            title: 'Create Account',
            headerShown: true,
            headerLeft: () => null,
            headerBackVisible: false,
          }}
        />
      </Stack>
    </AuthState>
  );
}
