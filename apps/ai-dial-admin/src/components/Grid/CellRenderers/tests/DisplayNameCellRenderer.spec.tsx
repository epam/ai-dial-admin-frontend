import { render, screen } from '@testing-library/react';
import type { ICellRendererParams } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import DisplayNameCellRenderer from '../DisplayNameCellRenderer';

const params = (data: Record<string, unknown>): ICellRendererParams => ({ data }) as unknown as ICellRendererParams;

describe('DisplayNameCellRenderer', () => {
  test('shows the displayName when present', () => {
    render(<DisplayNameCellRenderer {...params({ displayName: 'GPT-4 Turbo', name: 'gpt-4-turbo' })} />);

    expect(screen.getByText('GPT-4 Turbo')).toBeInTheDocument();
    expect(screen.getByText('gpt-4-turbo')).toBeInTheDocument();
  });

  test('falls back to the name when displayName is missing', () => {
    render(<DisplayNameCellRenderer {...params({ name: 'gpt-4-turbo' })} />);

    expect(screen.getByText('gpt-4-turbo')).toBeInTheDocument();
  });

  test('falls back to the name when displayName is an empty string', () => {
    render(<DisplayNameCellRenderer {...params({ displayName: '', name: 'gpt-4-turbo' })} />);

    expect(screen.getByText('gpt-4-turbo')).toBeInTheDocument();
  });

  test('renders without crashing when neither displayName nor name is set', () => {
    const { container } = render(<DisplayNameCellRenderer {...params({})} />);

    expect(container).toBeInTheDocument();
  });
});
