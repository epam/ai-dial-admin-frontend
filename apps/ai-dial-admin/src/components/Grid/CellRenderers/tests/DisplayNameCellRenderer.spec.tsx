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

  test('renders the display name as a link to the row address when one is given', () => {
    render(
      <DisplayNameCellRenderer
        {...params({ displayName: 'GPT-4 Turbo', name: 'gpt-4-turbo' })}
        getHref={() => '/models/gpt-4-turbo'}
      />,
    );

    expect(screen.getByRole('link', { name: 'GPT-4 Turbo' })).toHaveAttribute('href', '/models/gpt-4-turbo');
    expect(screen.getByText('gpt-4-turbo')).toBeInTheDocument();
  });

  test('renders no link when the row has no address', () => {
    render(<DisplayNameCellRenderer {...params({ displayName: 'GPT-4 Turbo' })} getHref={() => undefined} />);

    expect(screen.queryByRole('link')).toBeNull();
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
    expect(screen.queryByText('CH')).not.toBeInTheDocument();
  });

  test('shows the initials fallback when no type icon or iconUrl is supplied', () => {
    render(<DisplayNameCellRenderer {...params({ displayName: 'Chat', name: 'chat' })} />);

    expect(screen.getByText('CH')).toBeInTheDocument();
  });

  test.each([28, 40])('renders the initials avatar at %ipx', (iconSize) => {
    render(<DisplayNameCellRenderer {...params({ name: 'Chat' })} iconSize={iconSize} />);

    expect(screen.getByText('CH').closest(`[style*="${iconSize}px"]`)).not.toBeNull();
  });

  test.each([
    [28, 'dial-small-text-semi'],
    [40, 'dial-h3-text'],
  ])('renders appropriately sized initials for a %ipx avatar', (iconSize, textClass) => {
    render(<DisplayNameCellRenderer {...params({ name: 'Chat' })} iconSize={iconSize} />);

    expect(screen.getByText('CH')).toHaveClass(textClass);
  });

  test('uses the requested size for an entity image', () => {
    render(<DisplayNameCellRenderer {...params({ name: 'Chat', iconUrl: 'files/chat.png' })} iconSize={28} />);

    expect(screen.getByAltText('entityImage')).toHaveAttribute('width', '28');
    expect(screen.getByAltText('entityImage')).toHaveAttribute('height', '28');
  });

  test('derives two initials from a multi-word display name', () => {
    render(<DisplayNameCellRenderer {...params({ displayName: 'Claude Opus', name: 'claude-opus' })} />);

    expect(screen.getByText('CO')).toBeInTheDocument();
  });

  test('shows the entity image instead of initials when an iconUrl is supplied', () => {
    render(<DisplayNameCellRenderer {...params({ displayName: 'Chat', name: 'chat', iconUrl: 'files/chat.png' })} />);

    expect(screen.getByAltText('entityImage')).toBeInTheDocument();
    expect(screen.queryByText('CH')).not.toBeInTheDocument();
  });

  test('shows the digits of a numeric name instead of a placeholder', () => {
    render(<DisplayNameCellRenderer {...params({ displayName: '567393', name: '567393' })} />);

    expect(screen.getByText('56')).toBeInTheDocument();
    expect(screen.queryByText('?')).not.toBeInTheDocument();
  });

  test('renders without crashing when neither displayName nor name is set', () => {
    const { container } = render(<DisplayNameCellRenderer {...params({})} />);

    expect(container).toBeInTheDocument();
  });
});
