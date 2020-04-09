/**
 * @format
 */

import 'react-native';
import React from 'react';
import {render} from '@testing-library/react-native';
import App from '../App';

jest.mock('../app/Entry', () => 'Entry');

it('renders correctly', () => {
  const {asJSON} = render(<App />);

  expect(asJSON()).toMatchSnapshot();
});
