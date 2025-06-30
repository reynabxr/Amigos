jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
  useSegments: () => ['(app)'],
  Slot: ({ children }: any) => <>{children}</>,
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: (auth: any, callback: any) => {
    callback({ uid: '123' });
    return () => {};
  },
}));

jest.mock('../../services/firebaseConfig', () => {
  let _mockUser = {
    uid: 'mock-uid',
    email: 'mockuser@example.com',
    updateProfile: jest.fn(),
    sendEmailVerification: jest.fn(),
    reload: jest.fn(),
  };
  return {
    app: {},
    db: {},
    __setMockUser: (user: any) => { _mockUser = user; },
    get auth() {
      return {
        get currentUser() {
          return _mockUser;
        }
      };
    }
  };
});

import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import AuthState from '../AuthState';

// UT-012 passed
describe('AuthState', () => {
  it('renders children when authenticated', () => {
    const { getByText } = render(
      <AuthState>
        <Text>Authenticated Content</Text>
      </AuthState>
    );
    expect(getByText('Authenticated Content')).toBeTruthy();
  });
});