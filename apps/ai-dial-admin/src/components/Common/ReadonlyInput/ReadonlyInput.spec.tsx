import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import ReadonlyInput from './ReadonlyInput';

describe('ReadonlyInput', () => {
  test('renders the title and value', () => {
    render(<ReadonlyInput label="Test Title" value="Test Value" />);
    expect(screen.getByDisplayValue('Test Value')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  test('renders with empty value', () => {
    render(<ReadonlyInput label="Empty Value" />);
    expect(screen.getByDisplayValue('')).toBeInTheDocument();
    expect(screen.getByText('Empty Value')).toBeInTheDocument();
  });
});
