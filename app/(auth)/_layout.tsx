// app/(auth)/_layout.tsx
import { Stack } from 'expo-router';
import React from 'react';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="login" // Refers to app/(auth)/login.tsx
        options={{
          title: 'Log In',
          headerShown: true,
          headerLeft: () => null,
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="signup" // Refers to app/(auth)/signup.tsx
        options={{
          title: 'Create Account',
          headerShown: true,
          headerLeft: () => null,
          headerBackVisible: false,
        }}
      />
      {/* If you have googleSignIn.tsx in (auth): */}
      {/* <Stack.Screen
        name="googleSignIn"
        options={{ title: 'Sign In with Google', headerShown: true, headerBackTitle: ' ' }}
      /> */}
    </Stack>
  );
}
