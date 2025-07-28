jest.mock('expo-router', () => {
  const placeData = {
    id: 'place1',
    name: 'Test Place',
    address: '123 Main St',
    lat: 1.3,
    lng: 103.8,
    category: 'Cafe',
    cuisines: ['Cafe'],
    budget: '< $15',
    dietaryFlags: [],
    visitedAt: Date.now(),
  };
  const Stack = ({ children }: any) => <>{children}</>;
  Stack.Screen = ({ children }: any) => <>{children}</>;
  return {
    useLocalSearchParams: () => ({
      placeId: 'place1',
      placeData: JSON.stringify(placeData),
    }),
    Stack,
    router: { back: jest.fn() },
  };
});

jest.mock('../../../../components/StarRating', () => {
  const { TouchableOpacity } = require('react-native');
  return {
    StarRating: ({ onRate }: any) => (
      <TouchableOpacity testID="star-4" onPress={() => onRate && onRate(4)}>
      </TouchableOpacity>
    ),
  };
});

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  updateProfile: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  getReactNativePersistence: jest.fn(),
  initializeAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  setDoc: jest.fn(),
  doc: jest.fn(),
  onSnapshot: jest.fn((ref, callback) => {
    callback({ exists: () => false, data: () => ({}) });
    return jest.fn();
  }),
}));

jest.mock('../../../../services/firebaseConfig', () => {
  return {
    auth: {
      currentUser: { uid: 'test-user-id', email: 'test@example.com' },
    },
    db: {},
  };
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  mergeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
  multiMerge: jest.fn(),
}));

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PlaceDetailScreen from '../[placeId]';
import * as firestore from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore';
import { TouchableOpacity } from 'react-native';

// UT-015 passed
describe('PlaceDetailScreen rating logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saves and updates rating in Firestore and UI', async () => {

    const { getByTestId } = render(<PlaceDetailScreen />);

    fireEvent.press(getByTestId('star-4'));

    await waitFor(() => {
      expect(firestore.setDoc).toHaveBeenCalled();
    });

    const call = (firestore.setDoc as jest.Mock).mock.calls[0];
    expect(call[1]).toMatchObject({
      placeId: 'place1',
      rating: 4,
    });
  });
});