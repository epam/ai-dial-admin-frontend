import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Loader from './Loader';

describe('Loader', () => {
  it('renders with default size', () => {
    render(<Loader size={32} />);
    const loader = screen.getByRole('loader');
    expect(loader).toBeTruthy();
  });
});
