import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { View } from 'react-native';
import { StarRating } from '../StarRating';

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    Ionicons: (props: any) => <View testID={props.testID} />,
  };
});

describe('StarRating', () => {
  // UT-013 passed
  it('renders correct number of filled and empty stars', () => {
    const { getAllByTestId } = render(<StarRating rating={3} />);
    const filledStars = getAllByTestId('star-filled');
    const emptyStars = getAllByTestId('star-empty');
    expect(filledStars.length).toBe(3);
    expect(emptyStars.length).toBe(2);
  });

  // UT-014 passed
  it('calls onRate callback with correct value when a star is pressed', () => {
    const onRateMock = jest.fn();
    const { getAllByTestId } = render(<StarRating rating={0} onRate={onRateMock} />);
    const stars = getAllByTestId('star-empty');
    fireEvent.press(stars[3]);
    expect(onRateMock).toHaveBeenCalledWith(4);
  });
});