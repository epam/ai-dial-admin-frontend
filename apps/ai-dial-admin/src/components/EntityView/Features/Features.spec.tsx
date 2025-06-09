import { render } from '@testing-library/react';
import React from 'react';
import Features from './Features';

describe('EntityView - Features', () => {
  it('Should render successfully', () => {
    const { baseElement } = render(<Features entity={{}} onChangeEntity={jest.fn()} />);
    expect(baseElement).toBeTruthy();
  });
});
