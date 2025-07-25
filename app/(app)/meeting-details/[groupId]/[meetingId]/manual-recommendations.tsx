import { Ionicons } from '@expo/vector-icons'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import React, { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import { auth, db } from '../../../../../services/firebaseConfig'
import {
  FSQ_API_VERSION,
  FSQ_BASE,
  FSQ_TOKEN,
} from '../../../../../services/foursquareConfig'

const DIETARY_OPTIONS = [
  'Halal',
  'Vegetarian',
  'Vegan',
  'Pescatarian',
  'Kosher',
  'Gluten-free',
  'Lactose-free',
  'Nut-free',
  'Egg-free',
  'Soy-free',
]

export default function ManualSuggestionsScreen() {
  const { groupId, meetingId } = useLocalSearchParams<{ groupId: string, meetingId: string }>()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [fsqResults, setFsqResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form fields
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [category, setCategory] = useState('')
  const [budget, setBudget] = useState('')
  const [dietaryFlags, setDietaryFlags] = useState<string[]>([])
  const [lat, setLat] = useState(0)
  const [lng, setLng] = useState(0)

  // Foursquare search
  const searchFoursquare = async (text: string) => {
    setQuery(text)
    if (text.length < 2) {
      setFsqResults([])
      return
    }
    setIsSearching(true)
    try {
      const params = new URLSearchParams({
        query: text,
        near: 'Singapore', // or use meeting location if available
        limit: '5',
      })
      const res = await fetch(`${FSQ_BASE}/search?${params.toString()}`, {
        headers: {
          accept: 'application/json',
          'X-Places-Api-Version': FSQ_API_VERSION,
          authorization: FSQ_TOKEN,
        },
      })
      const json = await res.json()
      setFsqResults(json.results || [])
    } catch (e) {
      setFsqResults([])
    }
    setIsSearching(false)
  }

  // When user taps a Foursquare result, autofill the form
  const handleFsqSelect = (item: any) => {
    setName(item.name || '')
    setAddress(item.location?.formatted_address || '')
    setCategory(item.categories?.[0]?.name || '')
    setLat(item.geocodes?.main?.latitude || 0)
    setLng(item.geocodes?.main?.longitude || 0)
    setQuery(item.name || '')
    setFsqResults([])
    Keyboard.dismiss()
  }

  const handleAdd = async () => {
    if (!name.trim() || !address.trim() || !category.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.')
      return
    }
    setIsSaving(true)
    try {
      await addDoc(
        collection(db, 'groups', groupId!, 'meetings', meetingId!, 'manualSuggestions'),
        {
          name: name.trim(),
          address: address.trim(),
          category: category.trim(),
          budget: budget.trim(), // can be empty
          dietaryFlags: dietaryFlags.map(f => f.trim()).filter(f => f), // can be empty
          lat,
          lng,
          suggestedBy: auth.currentUser?.uid,
          createdAt: serverTimestamp(),
        }
      )
      Alert.alert('Success', 'Suggestion added!')
      setName('')
      setAddress('')
      setCategory('')
      setBudget('')
      setDietaryFlags([])
      setLat(0)
      setLng(0)
      setQuery('')
      router.back()
    } catch (e) {
      Alert.alert('Error', 'Failed to add suggestion.')
    }
    setIsSaving(false)
  }

  return (
    
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: 'Suggest a Restaurant' }} />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Section */}
      <View style={styles.section}>
  <Text style={styles.label}>Search for a place</Text>
  <View style={{ position: 'relative' }}>
    <View style={styles.searchRow}>
      <Ionicons name="search" size={18} color="#EA4080" style={{ marginRight: 6 }} />
      <TextInput
        style={styles.input}
        placeholder="Type restaurant name"
        value={query}
        onChangeText={searchFoursquare}
        autoCorrect={false}
        autoCapitalize="words"
      />
      {query.length > 0 && (
        <TouchableOpacity onPress={() => { setQuery(''); setFsqResults([]); }}>
          <Ionicons name="close-circle" size={20} color="#aaa" />
        </TouchableOpacity>
      )}
    </View>
    {isSearching && <ActivityIndicator size="small" color="#EA4080" style={{ marginTop: 8 }} />}
    {fsqResults.length > 0 && (
      <View style={styles.resultsDropdown}>
        {fsqResults.map(item => (
          <TouchableOpacity
            key={item.fsq_place_id}
            style={styles.resultItem}
            onPress={() => handleFsqSelect(item)}
          >
            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.name}</Text>
            <Text style={{ color: '#555', fontSize: 13 }}>{item.location?.formatted_address}</Text>
            <Text style={{ color: '#888', fontSize: 12 }}>{item.categories?.[0]?.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    )}
  </View>
</View>

        {/* Form Section */}
        <View style={styles.section}>
          <Text style={styles.label}>Name <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Sushi Tei"
            value={name}
            onChangeText={setName}
          />
          <Text style={styles.label}>Address <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 123 Orchard Road"
            value={address}
            onChangeText={setAddress}
          />
          <Text style={styles.label}>Category <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Japanese, Cafe"
            value={category}
            onChangeText={setCategory}
          />
          <Text style={styles.label}>Budget</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. $15-30 (optional)"
            value={budget}
            onChangeText={setBudget}
          />
          <Text style={styles.label}>Dietary Flags</Text>
<View style={styles.chipContainer}>
  {DIETARY_OPTIONS.map(option => {
    const selected = dietaryFlags.includes(option)
    return (
      <TouchableOpacity
        key={option}
        style={[
          styles.chip,
          selected ? styles.chipSelected : styles.chipUnselected,
        ]}
        onPress={() => {
          if (selected) {
            setDietaryFlags(dietaryFlags.filter(f => f !== option))
          } else {
            setDietaryFlags([...dietaryFlags, option])
          }
        }}
      >
        <Text
          style={[
            styles.chipText,
            selected ? styles.chipTextSelected : styles.chipTextUnselected,
          ]}
        >
          {option}
        </Text>
      </TouchableOpacity>
    )
  })}
</View>
        </View>

        <TouchableOpacity
          style={[styles.button, isSaving && { opacity: 0.6 }]}
          onPress={handleAdd}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Add Suggestion</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 18, color: '#EA4080', textAlign: 'center' },
  section: { marginBottom: 18 },
  label: { fontWeight: '600', marginTop: 12, marginBottom: 4, color: '#333', fontSize: 15 },
  required: { color: '#EA4080' },
  input: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 8,
    padding: 12, fontSize: 16, marginBottom: 2, backgroundColor: '#fafbfc'
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1, borderColor: '#eee', borderRadius: 8,
    backgroundColor: '#fafbfc',
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  resultsList: {
    maxHeight: 180,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
  },
  button: {
    backgroundColor: '#EA4080', borderRadius: 8,
    padding: 16, alignItems: 'center', marginTop: 10, marginBottom: 20,
    shadowColor: '#EA4080', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 17, letterSpacing: 1 },
  chipContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  marginTop: 4,
  marginBottom: 8,
},
chip: {
  paddingVertical: 7,
  paddingHorizontal: 14,
  borderRadius: 20,
  borderWidth: 1,
  margin: 4,
},
chipUnselected: {
  borderColor: '#ccc',
  backgroundColor: '#fff',
},
chipSelected: {
  borderColor: '#EA4080',
  backgroundColor: '#fff0f5',
},
chipText: {
  fontSize: 13,
},
chipTextUnselected: {
  color: '#777',
},
chipTextSelected: {
  color: '#EA4080',
  fontWeight: '600',
},
resultsDropdown: {
  position: 'absolute',
  top: 48, 
  left: 0,
  right: 0,
  backgroundColor: '#fff',
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#eee',
  zIndex: 10,
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  maxHeight: 200,
},
resultItem: {
  padding: 12,
  borderBottomColor: '#f0f0f0',
  borderBottomWidth: 1,
  backgroundColor: '#fff',
},
})