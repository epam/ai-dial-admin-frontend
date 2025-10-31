import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import ReadonlyField from './ReadonlyField';

describe('ReadonlyField', () => {
  test('renders the title and value', () => {
    render(<ReadonlyField title="Test Title" value="Test Value" />);
    expect(screen.getByDisplayValue('Test Value')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  test('renders with empty value', () => {
    render(<ReadonlyField title="Empty Value" />);
    expect(screen.getByDisplayValue('')).toBeInTheDocument();
    expect(screen.getByText('Empty Value')).toBeInTheDocument();
  });
});
