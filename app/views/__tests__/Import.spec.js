import 'react-native';
import React from 'react';
import renderer from 'react-test-renderer';
import Import from '../Import';

jest.spyOn(console, 'log').mockImplementationOnce(() => {});

it('renders correctly', () => {
  const tree = renderer
    .create(<Import />)
    .toJSON();
  expect(tree).toMatchSnapshot();
});
