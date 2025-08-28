import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Loader from './Loader';

describe('Loader', () => {
  it('renders with default size', () => {
    const { container } = render(<Loader />);
    // Should render an SVG with default size
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('height')).toBe('18');
    expect(svg?.getAttribute('width')).toBe('18');
  });

  it('renders with custom size', () => {
    const { container } = render(<Loader size={32} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('height')).toBe('32');
    expect(svg?.getAttribute('width')).toBe('32');
  });
});
