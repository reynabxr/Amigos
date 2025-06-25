// app/(app)/meeting-details/[groupId]/[meetingId]/recommendations.tsx

import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { RestaurantCard } from '../../../../../components/RestaurantCard';
import { auth, db } from '../../../../../services/firebaseConfig';
import { fetchRecommendations, getConsensus, recordVote } from '../../../../../services/recommendationServices';
import type { Place } from '../../../../../services/types';

export default function RecommendationsScreen() {
  const { groupId, meetingId } = useLocalSearchParams<{ groupId: string; meetingId: string }>();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [allFinished, setAllFinished] = useState(false);
  const [members, setMembers] = useState<string[]>([]);
  const [finishedMembers, setFinishedMembers] = useState<string[]>([]);
  const [userFinished, setUserFinished] = useState<boolean>(false);
  // NEW: State to hold the current swipe index
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const swiperRef = useRef<Swiper<Place> | null>(null);
  const memberId = auth.currentUser!.uid;

  // A. Load meeting data and saved progress
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const meetingDocRef = doc(db, 'groups', groupId!, 'meetings', meetingId!);
        const mSnap = await getDoc(meetingDocRef);
        if (!mSnap.exists()) throw new Error('Meeting not found');
        const mData = mSnap.data() as any;

        // Load group members:
        const groupSnap = await getDoc(doc(db, 'groups', groupId!));
        setMembers(groupSnap.data()?.members || []);

        // Check if a final recommendation is already set:
        if (mData.finalRecommendation) {
          setChosen(mData.finalRecommendation);
          setFinished(true);
          setLoading(false);
          return;
        }

        // Load saved swipe progress for the user:
        const swipeStatusDoc = await getDoc(
          doc(db, 'groups', groupId!, 'meetings', meetingId!, 'swipeStatus', memberId)
        );
        if (swipeStatusDoc.exists() && !swipeStatusDoc.data().finished) {
          const progress = swipeStatusDoc.data().currentIndex ?? 0;
          setCurrentIndex(progress);
          console.log('Resuming from saved index:', progress);
        } else {
          setCurrentIndex(0);
        }

        // Fetch recommendations normally
        const recs = await fetchRecommendations(groupId!, meetingId!);
        setPlaces(recs);
      } catch (err: any) {
        console.error('❌ Failed to load recommendations:', err);
        Alert.alert('Error', err.message || 'Could not load recommendations');
      } finally {
        setLoading(false);
      }
    })();
  }, [groupId, meetingId]);

  // B. Listen for swipeStatus changes
  useEffect(() => {
    if (!groupId || !meetingId) return;
    const unsub = onSnapshot(
      collection(db, 'groups', groupId, 'meetings', meetingId, 'swipeStatus'),
      (snap) => {
        const finishedList: string[] = [];
        snap.forEach((doc) => {
          if (doc.data().finished) finishedList.push(doc.id);
        });
        setFinishedMembers(finishedList);
        if (finishedList.includes(memberId)) {
          setUserFinished(true);
        } else {
          setUserFinished(false);
        }
        if (members.length > 0 && finishedList.length === members.length) {
          setAllFinished(true);
        } else {
          setAllFinished(false);
        }
      }
    );
    return () => unsub();
  }, [groupId, meetingId, members]);

  // C. When all are finished, check consensus and persist final recommendation.
  useEffect(() => {
    if (allFinished) {
      (async () => {
        const cons = await getConsensus(groupId!, meetingId!);
        setChosen(cons.restaurantIds ? cons.restaurantIds[0] : null);
        setWaiting(false);
        setFinished(true);
        await updateDoc(doc(db, 'groups', groupId!, 'meetings', meetingId!), {
          finalRecommendation: cons.restaurantIds ? cons.restaurantIds[0] : null,
          finalConsensusStatus: cons.status,
        });
      })();
    }
  }, [allFinished, groupId, meetingId]);

  // D. Mark user's swipe progress to Firestore.
  const updateSwipeProgress = async (index: number, finishedFlag: boolean = false) => {
    if (!groupId || !meetingId || !memberId) return;
    await setDoc(
      doc(db, 'groups', groupId, 'meetings', meetingId, 'swipeStatus', memberId),
      { finished: finishedFlag, currentIndex: index },
      { merge: true }
    );
  };

  // E. Handler for a swipe.
  const onSwipe = async (index: number, liked: boolean) => {
    const p = places[index];
    if (!p) return;
    try {
      await recordVote(groupId!, meetingId!, memberId, p.id, liked);
      const nextIndex = index + 1;
      if (nextIndex < places.length) {
        setCurrentIndex(nextIndex);
        await updateSwipeProgress(nextIndex);
      } else {
        // Last card swiped
        setFinished(true);
        await updateSwipeProgress(nextIndex, true);
        setWaiting(true);
      }
    } catch (e) {
      console.warn('Vote error:', e);
    }
  };

  // F. Conditional Rendering:
  if (loading) {
    return (
      <SafeAreaView style={s.center}>
        <ActivityIndicator size="large" color="#EA4080" />
      </SafeAreaView>
    );
  }

  // If the user finished but not all members, show a waiting screen.
  if (userFinished && !allFinished) {
    return (
      <SafeAreaView style={s.center}>
        <Text style={s.resultText}>
          You have finished voting. Waiting for all group members...
        </Text>
        <Text style={s.resultText}>
          {finishedMembers.length} of {members.length} finished.
        </Text>
      </SafeAreaView>
    );
  }

  // If consensus is reached, display final recommendations aesthetically.
  if (allFinished && chosen) {
   const finalPlaces = places.filter((p) => p.id === chosen)
    return (
      <SafeAreaView style={s.finalContainer}>
        <Text style={s.finalHeader}>
          {finalPlaces.length > 1
            ? 'Top Voted Option(s):'
            : 'Consensus Reached! Your Final Choice(s):'}
        </Text>
        <ScrollView contentContainerStyle={s.finalList}>
          {finalPlaces.map((p) => (
            <RestaurantCard key={p.id} place={p} />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Otherwise, show the swipe deck.
  return (
    <>
      {/* Add header configuration for the screen */}
      <Stack.Screen
        options={{
          title: 'Swipe to Decide',
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#333',
          headerTitleStyle: { fontWeight: 'bold', fontSize: 20 },
        }}
      />
      <SafeAreaView style={s.container}>
        {/* Persistent Instructions */}
        <View style={s.instructionsContainer}>
          <Text style={s.instructionsText}>
            Swipe right for YES, left for NO
          </Text>
        </View>
        <View style={s.swiperContainer}>
          <Swiper
            ref={(ref: Swiper<Place> | null) => {
              swiperRef.current = ref;
            }}
            cards={places}
            renderCard={(p) => (p ? <RestaurantCard place={p} /> : null)}
            onSwipedLeft={(i) => onSwipe(i, false)}
            onSwipedRight={(i) => onSwipe(i, true)}
            onSwipedAll={async () => {
              setFinished(true);
              await updateSwipeProgress(places.length, true);
              setWaiting(true);
            }}
            cardIndex={currentIndex}
            stackSize={3}
            backgroundColor="transparent"
            disableTopSwipe
            disableBottomSwipe
            overlayLabels={{
              left: {
                title: 'NOPE',
                style: {
                  label: s.overlayLabel,
                  wrapper: s.overlayWrapperNope,
                },
              },
              right: {
                title: 'LIKE',
                style: {
                  label: s.overlayLabel,
                  wrapper: s.overlayWrapperLike,
                },
              },
            }}
          />
        </View>
        <View style={s.buttonsContainer}>
          <TouchableOpacity
            style={[s.button, s.nopeButton]}
            onPress={() => {
              console.log('Nope button pressed');
              swiperRef.current?.swipeLeft();
            }}
          >
            <Ionicons name="close" size={32} color="#EA4080" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.button, s.likeButton]}
            onPress={() => {
              console.log('Like button pressed');
              swiperRef.current?.swipeRight();
            }}
          >
            <Ionicons name="heart" size={32} color="#4CAF50" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );

  function consensusDataAvailable(): boolean {
    // For now, we consider consensus data available if 'chosen' is not null.
    return chosen !== null;
  }
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f8',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionsContainer: {
    width: '100%',
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  instructionsText: {
    fontSize: 16,
    color: '#555',
    fontWeight: '600',
  },
  swiperContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
  },
  overlayLabel: {
    fontSize: 45,
    fontWeight: 'bold',
    color: 'white',
    padding: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  overlayWrapperNope: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    backgroundColor: 'rgba(234, 64, 128, 0.7)',
    borderRadius: 18,
    paddingRight: 20,
  },
  overlayWrapperLike: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    backgroundColor: 'rgba(76, 175, 80, 0.7)',
    borderRadius: 18,
    paddingLeft: 20,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    paddingBottom: 30,
  },
  button: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 40,
  },
  nopeButton: {
    borderColor: '#EA4080',
    borderWidth: 2,
  },
  likeButton: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  resultText: {
    fontSize: 18,
    textAlign: 'center',
    padding: 20,
  },
  finalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f4f4f8',
  },
  finalHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
    color: '#333',
  },
  finalList: {
    paddingVertical: 10,
    alignItems: 'center',
  },
});