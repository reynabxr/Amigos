// switches between (auth) and (app) pages based on user authentication state
import { Slot, useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from 'react';

const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // set initial authentication as false
  // insert actual authentication logic
  return { isAuthenticated, isLoading: false }; 
}

export default function RootLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const inAuthGroup = segments[0] === "(auth)";
  const inAppGroup = segments[0] === "(app)";

  useEffect(() => {
    if (isLoading) return; // don't do anything while loading
    if (!isAuthenticated && !inAuthGroup) { // only redirect if not authenticated and not already in auth group
      router.replace("/(auth)");
    } else if (isAuthenticated && !inAppGroup) { // only redirect if authenticated and not already in app group
      router.replace("/(app)/home");
    }
  }, [isAuthenticated, isLoading, segments, router]);

  return <Slot />;
}
