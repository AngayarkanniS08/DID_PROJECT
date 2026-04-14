import React from 'react';
import { render } from '@testing-library/react-native';
import UiKit from './ui-kit';

describe('UiKit', () => {
  it('should render successfully', () => {
    const { root } = render(<UiKit />);
    expect(root).toBeTruthy();
  });
});
