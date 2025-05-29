import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function AppTabLayout() {
  return (
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
          headerTitle: 'My Groups',
        }}
      />
      <Tabs.Screen
        name="profile" 
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (<FontAwesome name="user-o" size={size} color={color} />),
          headerTitle: 'My Profile',
        }}
      />
      <Tabs.Screen
        name="preferences" 
        options={{
          headerShown: false,
          href: null,     // Hides this from the tab bar
        }}
      />
      <Tabs.Screen 
        name="index"
        options={{
          href: null,
        }}
        />
    
    </Tabs>
  );
}
