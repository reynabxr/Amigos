// app/(app)/meeting-details/[groupId]/[meetingId]/recommendations.tsx

import { useLocalSearchParams } from 'expo-router'
import { doc, getDoc } from 'firebase/firestore'
import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import Swiper from 'react-native-deck-swiper'
import { RestaurantCard } from '../../../../../components/RestaurantCard'
import { auth, db } from '../../../../../services/firebaseConfig'
import {
  fetchRecommendations,
  getConsensus,
  recordVote,
} from '../../../../../services/recommendationServices'
import type { Place } from '../../../../../services/types'

export default function RecommendationsScreen() {
  const { groupId, meetingId } = useLocalSearchParams<{
    groupId: string
    meetingId: string
  }>()
  console.log('Recommendations params:', { groupId, meetingId })
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [finished, setFinished] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const swiperRef = useRef<Swiper<Place>>(null)
  const memberId = auth.currentUser!.uid

  // Load meeting → fetch recommendations
  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        console.log('🏷️  Loading recommendations for', { groupId, meetingId })

        // 1) Get meeting doc to grab the "near" text
        const mSnap = await getDoc(
          doc(db, 'groups', groupId!, 'meetings', meetingId!)
        )
        if (!mSnap.exists()) {
          throw new Error('Meeting not found')
        }
        const near = mSnap.data()?.location || 'Singapore'
        console.log('🏷️  near text =', near)

        // 2) Fetch recs
        const recs = await fetchRecommendations(groupId!, meetingId!)
        console.log('🏷️  fetched recs:', recs)
        setPlaces(recs)
      } catch (err: any) {
        console.error('❌ Failed to load recommendations:', err)
        Alert.alert(
          'Error',
          err.message || 'Could not load recommendations'
        )
      } finally {
        setLoading(false)
      }
    })()
  }, [groupId, meetingId])

  // record a swipe vote and check consensus
  const onSwipe = async (index: number, liked: boolean) => {
    const p = places[index]
    if (!p) return
    try {
      await recordVote(
        groupId!,
        meetingId!,
        memberId,
        p.id,
        liked
      )
      const cons = await getConsensus(groupId!, meetingId!)
      if (cons.status === 'chosen') {
        setChosen(cons.restaurantId!)
        setFinished(true)
      } else if (index + 1 >= places.length) {
        setFinished(true)
      }
    } catch (e) {
      console.warn('Vote error:', e)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={s.center}>
        <ActivityIndicator size="large" color="#EA4080" />
      </SafeAreaView>
    )
  }

  // no recommendations at all
  if (!loading && places.length === 0) {
    return (
      <SafeAreaView style={s.center}>
        <Text style={s.resultText}>
          No restaurant options available.
        </Text>
      </SafeAreaView>
    )
  }

  // consensus reached or out of cards
  if (finished) {
    const win = places.find((p) => p.id === chosen)
    return (
      <SafeAreaView style={s.center}>
        <Text style={s.resultText}>
          {win
            ? `🎉 Chosen: ${win.name}`
            : 'No unanimous choice—top voted.'}
        </Text>
      </SafeAreaView>
    )
  }

  // main swipe deck
  return (
    <SafeAreaView style={s.container}>
      <Swiper
        ref={swiperRef}
        cards={places}
        renderCard={(p) =>
          p ? (
            <RestaurantCard place={p} />
          ) : (
            <View style={s.emptyCard}>
              <Text style={s.emptyCardText}>No more cards</Text>
            </View>
          )
        }
        onSwipedLeft={(i) => onSwipe(i, false)}
        onSwipedRight={(i) => onSwipe(i, true)}
        onSwipedAll={() => setFinished(true)}
        cardIndex={0}
        stackSize={3}
        backgroundColor="transparent"
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  resultText: {
    fontSize: 18,
    textAlign: 'center',
    padding: 20
  },
  emptyCard: {
    width: 300,
    height: 380,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderRadius: 12
  },
  emptyCardText: {
    color: '#888',
    fontSize: 16
  }
})