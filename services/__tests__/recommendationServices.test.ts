jest.mock('firebase/auth', () => ({
  getReactNativePersistence: jest.fn(),
  initializeAuth: jest.fn(),
}));
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
}));

import { mapFoursquarePriceToBudget } from '../recommendationServices';

// UT-001 passed
describe('mapFoursquarePriceToBudget', () => {
  it('returns correct budget string for each price level', () => {
    expect(mapFoursquarePriceToBudget(1)).toBe('< $15');
    expect(mapFoursquarePriceToBudget(2)).toBe('$15 - $30');
    expect(mapFoursquarePriceToBudget(3)).toBe('$30 - $50');
    expect(mapFoursquarePriceToBudget(4)).toBe('> $50');
    expect(mapFoursquarePriceToBudget(undefined)).toBe('');
    expect(mapFoursquarePriceToBudget(0)).toBe('');
  });
});