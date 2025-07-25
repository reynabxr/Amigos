import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, onSnapshot, writeBatch } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../../../../services/firebaseConfig';

export default function MeetingDetailsScreen() {
  const { groupId, meetingId, from } = useLocalSearchParams<{
    groupId: string;
    meetingId: string;
    from?: string;
  }>();
  const router = useRouter();
  const navigation = useNavigation();
  const [meeting, setMeeting] = useState<any>(null);
  const [creatorName, setCreatorName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [preferencesSubmitted, setPreferencesSubmitted] = useState<Set<string>>(new Set());
  const [memberNames, setMemberNames] = useState<{ [uid: string]: string }>({});
  const [finalChoices, setFinalChoices] = useState<any[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);

  const formatDateTime = (timestamp: number) => {
    if (!timestamp) return 'No date';
    const dateObj = new Date(timestamp);
    return `${dateObj.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}, ${dateObj.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }).replace(' ', '')}`;
  };

  useFocusEffect(
    useCallback(() => {
      const beforeRemove = navigation.addListener('beforeRemove', (e) => {
        e.preventDefault();
        router.replace('/home');
      });
      return () => beforeRemove();
    }, [router, navigation])
  );
  
  useEffect(() => {
    if (!groupId || !meetingId) return;

    setIsLoading(true);
    const meetingDocRef = doc(db, 'groups', groupId, 'meetings', meetingId);
    console.log(`[MeetingDetails] Setting up listener for meeting: ${meetingId}`);
    
    const unsubscribe = onSnapshot(meetingDocRef, async (meetingSnap) => {
      console.log('--- [MeetingDetails] onSnapshot FIRED! --- A change was detected on the meeting document.');
      if (!meetingSnap.exists()) {
        setMeeting(null);
        setIsLoading(false);
        return;
      }
      
      const meetingData = meetingSnap.data();
      console.log('[MeetingDetails] Received raw meetingData:', JSON.stringify(meetingData, null, 2));
      
      let finalPlacesData: any[] = [];
      if (meetingData.finalRecommendations && meetingData.finalRecommendations.length > 0) {
        console.log('[MeetingDetails] `finalRecommendations` field found. Fetching place details...');
        try {
            const recsRef = collection(db, 'groups', groupId, 'meetings', meetingId, 'recommendations');
            const recsSnap = await getDocs(recsRef);
            const allPlaces = recsSnap.docs.map(d => d.data());
            
            finalPlacesData = allPlaces.filter(p => meetingData.finalRecommendations.includes(p.id));
            console.log(`[MeetingDetails] Successfully filtered places. Found ${finalPlacesData.length} matching final choices.`);
        } catch (e) {
            console.error("[MeetingDetails] Error fetching recommendations subcollection:", e);
        }
      } else {
        console.log('[MeetingDetails] `finalRecommendations` field is missing, null, or empty.');
      }

      let fetchedCreatorName = 'Unknown User';
      if (meetingData.createdBy) {
        const userSnap = await getDoc(doc(db, 'users', meetingData.createdBy));
        if (userSnap.exists()) {
          const userData = userSnap.data();
          fetchedCreatorName = userData.username || userData.email || 'Unknown User';
        }
      }

      const groupSnap = await getDoc(doc(db, 'groups', groupId));
      const fetchedMembers = groupSnap.data()?.members || [];
      const fetchedMemberNames: { [uid: string]: string } = {};
      if (fetchedMembers.length > 0) {
        const userDocs = await Promise.all(fetchedMembers.map((uid: string) => getDoc(doc(db, 'users', uid))));
        userDocs.forEach(docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            fetchedMemberNames[docSnap.id] = data.username || data.email || `User ${docSnap.id.substring(0, 4)}...`;
          } else {
            fetchedMemberNames[docSnap.id] = `Unknown User (${docSnap.id.substring(0, 4)}...)`;
          }
        });
      }

      const prefsSnapshot = await getDocs(collection(db, 'groups', groupId, 'meetings', meetingId, 'preferences'));
      const submittedSet = new Set<string>();
      prefsSnapshot.docs.forEach(doc => submittedSet.add(doc.id));

      setMeeting(meetingData);
      setFinalChoices(finalPlacesData);
      setCreatorName(fetchedCreatorName);
      setGroupMembers(fetchedMembers);
      setMemberNames(fetchedMemberNames);
      setPreferencesSubmitted(submittedSet);
      setIsLoading(false);
    });

    return () => {
        console.log(`[MeetingDetails] Unsubscribing from listener for meeting: ${meetingId}`);
        unsubscribe();
    };
  }, [groupId, meetingId]);

  const handleConfirmEating = async (place: any) => {
    if (!place || !place.id || !groupId || !meetingId) {
      Alert.alert("Error", "Could not confirm the place due to missing data.");
      return;
    }

    setIsConfirming(true);
    try {
      // 1. Prepare a batch write.
      const batch = writeBatch(db);
      
      // 2. Get a reference to the meeting document.
      const meetingDocRef = doc(db, 'groups', groupId, 'meetings', meetingId);

      // 3. Update the meeting document to confirm the choice.
      // This is the only action we need to perform on the client-side.
      batch.update(meetingDocRef, { 
        eatingConfirmed: true,
        finalPlaceId: place.id,
      });

      // 4. Commit the batch.
      await batch.commit();

      // The Cloud Function (or the "Pull" logic on home screen)
      // will handle populating everyone's history.
      Alert.alert("Success!", `${place.name} has been confirmed as the final choice.`);

    } catch (error) {
      console.error("Failed to confirm eating place: ", error);
      Alert.alert("Error", "There was an issue saving the final choice. Please check your permissions.");
    } finally {
      setIsConfirming(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color="#EA4080" />
      </SafeAreaView>
    );
  }

  if (!meeting) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.errorText}>Meeting not found.</Text>
      </SafeAreaView>
    );
  }
console.log(`[MeetingDetails] --- RENDERING ---. finalChoices count: ${finalChoices.length}. meeting.eatingConfirmed: ${meeting?.eatingConfirmed}`);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
            options={{
                title: meeting.name,
                headerLeft: () => (
                <TouchableOpacity
                    onPress={() => {
                    if (from === 'home') {
                        router.replace('/home');
                    } else if (from === 'group') {
                        router.replace({
                        pathname: '/groups/[id]',
                        params: { id: groupId },
                        });
                      } else if (from === 'see-all-meetings') {
                        router.replace('/see-all-meetings');
                    } else {
                        router.back();
                    }
                    }}
                    style={{ marginLeft: 10 }}
                >
                    <Ionicons name="arrow-back" size={24} color="#EA4080" />
                </TouchableOpacity>
                ),
            }}
        />

      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity
        onPress={() =>
          router.push({ pathname: "/meeting-edit/[groupId]/[meetingId]", params: { groupId, meetingId } })
          
        }
        style={styles.editMeetingButtonTouchable}
      >
        <Ionicons name="create-outline" size={16} color="#fff" />
        <Text style={styles.editMeetingButtonText}>Edit</Text>
      </TouchableOpacity>
        <Text style={styles.label}>Meeting Name</Text>
        <Text style={styles.value}>{meeting.name}</Text>

        <Text style={styles.label}>Date & Time</Text>
        <Text style={styles.value}>{formatDateTime(meeting.date)}</Text>

        <Text style={styles.label}>Location</Text>
        <Text style={styles.value}>{meeting.location}</Text>

        <Text style={styles.label}>Created By</Text>
        <Text style={styles.value}>{creatorName}</Text>

        <Text style={[styles.label, { marginTop: 30, marginBottom: 10 }]}>Members' Preferences</Text>
        {groupMembers.length === 0 ? (
          <Text style={styles.emptyMembersText}>No members found.</Text>
        ) : (
          groupMembers.map((memberUid) => (
            <View key={memberUid} style={styles.memberRow}>
              {preferencesSubmitted.has(memberUid) ? (
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              ) : (
                <Ionicons name="ellipse-outline" size={20} color="#ccc" />
              )}
              <Text style={styles.memberText}>{memberNames[memberUid] || memberUid}</Text>
            </View>
          ))
        )}
        
        {/* this section appears after swiping is done, but BEFORE a choice is confirmed */}
        {finalChoices.length > 0 && !meeting.eatingConfirmed && (
           <View style={styles.finalizationContainer}>
            <Text style={styles.finalChoiceHeader}>
              Finalize Your Choice
            </Text>

            {finalChoices.map(place => (
              <View key={place.id} style={styles.finalChoiceCard}>
                <Text style={styles.finalChoiceName}>{place.name}</Text>
                <TouchableOpacity
                  style={[styles.confirmButton, isConfirming && styles.disabledButton]}
                  onPress={() => handleConfirmEating(place)}
                  disabled={isConfirming}
                  activeOpacity={0.7}
                >
                  <Text style={styles.confirmButtonText}>Confirm We Ate Here</Text>
                </TouchableOpacity>
              </View>
            ))}
            
            <TouchableOpacity
              style={styles.manualConfirmLink}
              onPress={() => router.push({
                pathname: '/meeting-details/[groupId]/[meetingId]/manual-final-restaurant',
                params: { groupId, meetingId }
              })}
            >
              <Text style={styles.manualConfirmLinkText}>Ate somewhere else?</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* this section appears PERMANENTLY after a choice is confirmed */}
        {meeting?.eatingConfirmed && finalChoices.length > 0 && (
             <View style={styles.confirmedContainer}>
                <Text style={styles.confirmedHeader}>Final Choice Confirmed!</Text>
                <Text style={styles.confirmedText}>
                ✅ {finalChoices.find(p => p.id === meeting.finalPlaceId)?.name || 'Confirmed Restaurant'}
                </Text>
            </View>
        )}

        <TouchableOpacity
          style={styles.preferenceButton}
          onPress={() =>
            router.push({ pathname: "/meeting-preferences/[groupId]/[meetingId]", params: { groupId, meetingId, from } })
          }
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#EA4080', '#FFC174']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.gradient}
          >
            <Ionicons name="fast-food-outline" size={20} color="#fff" />
            <Text style={styles.preferenceButtonText}>Set Preferences</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
  style={styles.preferenceButton}
  onPress={() =>
    router.push({
      pathname: '/meeting-details/[groupId]/[meetingId]/manual-recommendations' as any,
      params: { groupId, meetingId },
    })
  }
  activeOpacity={0.7}
>
  <LinearGradient
    colors={['#FF8800', '#FFB300']} 
    start={{ x: 0, y: 0.5 }}
    end={{ x: 1, y: 0.5 }}
    style={styles.gradient}
  >
    <Ionicons name="add-outline" size={20} color="#fff" />
    <Text style={styles.preferenceButtonText}>Suggest a Restaurant</Text>
  </LinearGradient>
</TouchableOpacity>
        <TouchableOpacity
          style={styles.preferenceButton}   
          onPress={() =>
            router.push({
              pathname: "/meeting-details/[groupId]/[meetingId]/recommendations" as any,
              params: { groupId, meetingId },
            })
          }
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#00C6FF', '#0072FF']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.gradient}
          >
            <Ionicons name="restaurant-outline" size={20} color="#fff" />
            <Text style={styles.preferenceButtonText}>
              Pick Restaurant
            </Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 24,
  },
  label: {
    fontWeight: '600',
    marginTop: 24,
    fontSize: 16,
    color: '#222',
  },
  value: {
    fontSize: 18,
    color: '#444',
    marginTop: 6,
    backgroundColor: '#f7f7f7',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  editMeetingButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  editMeetingButtonTouchable: {
    position: 'absolute',
    top: 15,
    right: 20,
    backgroundColor: '#EA4080',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    alignSelf: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    zIndex: 10,
  },
  gradient: {
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  preferenceButton: {
    marginTop: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  preferenceButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  memberText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#555',
    flex: 1,
  },
  emptyMembersText: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 6,
  },

  finalizationContainer: {
    backgroundColor: '#f8f9fa', 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    padding: 20,
    marginTop: 30,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  finalChoiceHeader: {
    fontSize: 20, 
    fontWeight: 'bold',
    color: '#343a40',
    marginBottom: 20, 
    textAlign: 'center',
  },
  finalChoiceCard: {
    backgroundColor: '#fff', 
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  finalChoiceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  disabledButton: {
    backgroundColor: '#aaa',
  },
  manualConfirmLink: {
    marginTop: 15,
    alignItems: 'center',
  },
  manualConfirmLinkText: {
    color: '#007AFF', 
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  confirmedContainer: {
    backgroundColor: '#e8f5e9', 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c8e6c9',
    padding: 20,
    marginTop: 30,
    alignItems: 'center',
  },
  confirmedHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1b5e20',
    marginBottom: 10,
  },
  confirmedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2e7d32', 
  },
});