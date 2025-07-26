import * as Device from 'expo-device'; // This will now be found
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { arrayUnion, doc, setDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { auth, db } from './firebaseConfig';

// --- THIS IS THE FIX for the NotificationBehavior error ---
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true, // It's good practice to allow sound
    shouldSetBadge: false,
    shouldShowBanner: true, // for the banner that drops down
    shouldShowList: true,   // for showing it in the notification center
  }),
});

export const usePushNotifications = () => {
  const router = useRouter();

  useEffect(() => {
    registerForPushNotificationsAsync();

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;

      // --- THIS IS THE FIX for the groupId/meetingId error ---
      // Safely check if the data exists and is the correct type (string)
      if (data && typeof data.groupId === 'string' && typeof data.meetingId === 'string') {
        const { groupId, meetingId } = data;
        
        // Now that TypeScript knows they are strings, this is safe
        router.push({
          pathname: '/meeting-details/[groupId]/[meetingId]',
          params: { groupId, meetingId },
        });
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);
};

async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    // alert("Must use physical device for Push Notifications");
    console.log("Push notifications are not available on simulators.");
    return;
  }
  
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.log('User did not grant permission for push notifications.');
    return;
  }

  try {
    // --- IMPORTANT: Ensure you have this environment variable ---
    const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
    if (!projectId) {
        throw new Error("EXPO_PUBLIC_EAS_PROJECT_ID is not set in your environment variables.");
    }
    
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    
    const user = auth.currentUser;
    if (user && token) {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { pushTokens: arrayUnion(token) }, { merge: true });
      console.log('Push token saved successfully!');
    }
  } catch (error) {
    console.error("Error getting or saving push token:", error);
    // Alert.alert("Push Notification Error", "Could not register for push notifications.");
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
}