import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import StatusCellRenderer from '../StatusCellRenderer';

describe('StatusCellRenderer', () => {
  test('renders status dot with class and value', () => {
    const { container } = render(<StatusCellRenderer value="Active" statusClass="bg-green" />);
    const dot = container.querySelector('.bg-green');
    expect(dot).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  test('renders with empty statusClass', () => {
    render(<StatusCellRenderer value="Inactive" />);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });
});
