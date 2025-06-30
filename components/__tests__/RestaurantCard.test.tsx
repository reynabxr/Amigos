import React from 'react';
import { render } from '@testing-library/react-native';
import { RestaurantCard } from '../RestaurantCard';

const originalError = console.error;
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('An update to Icon inside a test was not wrapped in act')
    ) {
      return;
    }
    originalError.call(console, ...args);
  });
});
afterAll(() => {
  (console.error as jest.Mock).mockRestore?.();
});

// UT-007 passed
describe('RestaurantCard', () => {
  it('renders restaurant info', () => {
    const place = {
      id: '1',
      name: 'Test Restaurant',
      address: '123 Main St',
      lat: 1.3,
      lng: 103.8,
      category: 'Japanese Restaurant',
      cuisines: ['Japanese'],
      budget: '< $15',
      dietaryFlags: ['Halal'],
    };
    const { getByText } = render(<RestaurantCard place={place} />);
    expect(getByText('Test Restaurant')).toBeTruthy();
    expect(getByText('Japanese Restaurant')).toBeTruthy();
    expect(getByText('Budget: < $15')).toBeTruthy();
    expect(getByText('Cuisine: Japanese')).toBeTruthy();
    expect(getByText('Dietary: Halal')).toBeTruthy();
  });
});