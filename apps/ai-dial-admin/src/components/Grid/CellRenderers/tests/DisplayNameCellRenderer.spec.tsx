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

  test('shows the type icon instead of the entity icon and initials when one is supplied', () => {
    const TypeIcon = () => <svg role="img" aria-label="type icon" />;
    render(
      <DisplayNameCellRenderer
        {...params({ displayName: 'Chat', name: 'chat', iconUrl: 'files/chat.png' })}
        typeIcon={TypeIcon}
      />,
    );

    expect(screen.getByRole('img', { name: 'type icon' })).toBeInTheDocument();
    expect(screen.queryByText('C')).not.toBeInTheDocument();
  });

  test('shows the initials fallback when no type icon or iconUrl is supplied', () => {
    render(<DisplayNameCellRenderer {...params({ displayName: 'Chat', name: 'chat' })} />);

    expect(screen.getByText('C')).toBeInTheDocument();
  });

  test('renders without crashing when neither displayName nor name is set', () => {
    const { container } = render(<DisplayNameCellRenderer {...params({})} />);

    expect(container).toBeInTheDocument();
  });
});
