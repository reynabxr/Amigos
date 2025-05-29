// switches between (auth) and (app) pages based on user authentication state
import { Slot, useRouter, useSegments } from "expo-router";
import { onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { auth } from '../services/firebaseConfig';

const AuthState = () => {
  console.log("AuthState: Component rendering/mounted.");
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);  // state to hold the firebase user
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // state to track if auth state is still loading
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // handle non-initialised auth
    console.log("AuthState: Initial useEffect for onAuthStateChanged setup.");
    if (!auth) {
      console.warn("Auth not initialised.");
      setIsLoadingAuth(false);
      return;
    }

    // check auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("auth state changed: ", user ? user.uid : null);
      setFirebaseUser(user); // update state with firebase user
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []); 

  useEffect(() => {
    if (isLoadingAuth) {
      return; // don't do anything while loading auth state
    }

    const isAuthenticated = !!firebaseUser; // true if firebaseUser is not null
    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';

    if (!isAuthenticated && !inAuthGroup) {
      // if not authenticated & currently not in auth screen (login/signup), redirect to login
      console.log("redirecting to login");
      router.replace('/(auth)');
    } else if (isAuthenticated && inAuthGroup) {
      // if authenticated & currently in an auth screen (login/signup), redirect to app's main screen
      console.log("redirecting to app");
      router.replace('/(app)');
    } else if (isAuthenticated && !inAppGroup && segments.length > 0 && segments[0] !== '_sitemap') {
      // if authenticated but somehow not in app
      console.log("redirecting to app");
      router.replace('/(app)');
    }
    // if authenticated & currently in app, user is in the right place (do nothing)
    // if not authenticated & currently in auth screen (login/signup), user is in the right place (do nothing)

  }, [firebaseUser, isLoadingAuth, segments, router]);

  // loading screen
  if (isLoadingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }
  return <Slot />;
};

export default function RootLayout() {
  return <AuthState />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});