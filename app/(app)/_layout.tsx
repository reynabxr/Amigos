import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useRef } from 'react';
import AuthState from "../../components/AuthState";
import { auth, db } from '../../services/firebaseConfig';

export default function AppTabLayout() {
  const router = useRouter();
  const onboardingCheckCompleted = useRef(false)

  useEffect(() => {
    const unsubscribeFromAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        if (onboardingCheckCompleted.current) {
          return;
        }

        const userDocRef = doc(db, 'users', user.uid);

        const unsubscribeFromFirestore = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists() && docSnap.data().requiresOnboarding === true) {
            console.log("User document found with requiresOnboarding=true. Navigating...");     
            onboardingCheckCompleted.current = true;          
            unsubscribeFromFirestore();            
            router.push('/preferences?isOnboarding=true');

          } else if (docSnap.exists() && docSnap.data().requiresOnboarding === false) {
            console.log("User has already completed onboarding.");
            onboardingCheckCompleted.current = true;
            unsubscribeFromFirestore();
          }
        }, (error) => {
          unsubscribeFromFirestore();
        });

        return () => unsubscribeFromFirestore();

      } else {
        onboardingCheckCompleted.current = false;
      }
    });

    return () => unsubscribeFromAuth();
  }, [router]);

  return (
    <AuthState>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#E15A7C',
          tabBarInactiveTintColor: 'gray',
        }}
      >
        <Tabs.Screen
          name="home" 
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (<Ionicons name="home-outline" size={size} color={color} />),
            headerTitle: 'Amigos Home',
          }}
        />
        <Tabs.Screen
          name="groups" 
          options={{
            title: 'Groups',
            tabBarIcon: ({ color, size }) => (<MaterialCommunityIcons name="account-group-outline" size={size} color={color} />),
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="profile" 
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (<FontAwesome name="user-o" size={size} color={color} />),
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="preferences"
          options={{
            href: null,
            headerShown: false,
          }}
        />
        <Tabs.Screen 
          name="index"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="meeting-details"
          options={{
            href: null,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="see-all-meetings"
          options={{
            href: null,
            headerShown: true,
          }}
        />
          <Tabs.Screen
          name="see-all-places"
          options={{
            href: null,
            headerShown: true,
          }}
        />
          <Tabs.Screen
          name="places/[placeId]"
          options={{
            href: null,
            headerShown: true,
          }}
        />
      </Tabs>
    </AuthState>
  );
}
