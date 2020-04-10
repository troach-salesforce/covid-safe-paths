import 'react-native';
import React from 'react';
import renderer from 'react-test-renderer';
import Overlap from '../Overlap';

it('renders correctly', () => {
  // https://github.com/facebook/jest/issues/6434
  jest.useFakeTimers();
  const tree = renderer
    .create(<Overlap />)
    .toJSON();
  expect(tree).toMatchSnapshot();
});
