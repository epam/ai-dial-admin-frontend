import { render } from '@testing-library/react';
import React from 'react';
import Features from './Features';
import { describe, expect, test, vi } from 'vitest';

describe('EntityView - Features', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(<Features entity={{}} onChangeEntity={vi.fn()} />);
    expect(baseElement).toBeTruthy();
  });
});
