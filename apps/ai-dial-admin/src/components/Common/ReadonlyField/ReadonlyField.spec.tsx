import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ReadonlyField from './ReadonlyField';

describe('ReadonlyField', () => {
  it('renders the title and value', () => {
    render(<ReadonlyField title="Test Title" value="Test Value" />);
    expect(screen.getByDisplayValue('Test Value')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders with empty value', () => {
    render(<ReadonlyField title="Empty Value" />);
    expect(screen.getByDisplayValue('')).toBeInTheDocument();
    expect(screen.getByText('Empty Value')).toBeInTheDocument();
  });
});
