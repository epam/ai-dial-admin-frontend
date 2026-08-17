import { render, screen } from '@testing-library/react';
import { ICellRendererParams } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import UserCellRenderer from '@/src/components/Analytics/ConversationsTrace/List/UserCellRenderer';
import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { ConversationRow } from '@/src/models/analytics/conversations-trace';

const row = (overrides: Partial<ConversationRow> = {}): ConversationRow => ({
  chat_id: 'chat-1',
  project_id: 'internal-copilot',
  user_hash: 'db7327ba3decd351',
  turn_count: 3,
  total_tokens: 7200,
  total_price: '0.065',
  last_request_time: 1,
  first_request_time: 1,
  rating_up: 0,
  rating_down: 0,
  ...overrides,
});

const renderCell = (data?: ConversationRow | null) =>
  render(<UserCellRenderer {...({ data } as ICellRendererParams<ConversationRow>)} />);

describe('UserCellRenderer', () => {
  test('shows the user hash', () => {
    renderCell(row());

    expect(screen.getByText('db7327ba3decd351')).toBeInTheDocument();
  });

  test('marks an absent hash with the placeholder rather than rendering an empty cell', () => {
    renderCell(row({ user_hash: null }));

    expect(screen.getByText(UNAVAILABLE_VALUE)).toBeInTheDocument();
  });

  test('treats an empty hash as absent', () => {
    renderCell(row({ user_hash: '' }));

    expect(screen.getByText(UNAVAILABLE_VALUE)).toBeInTheDocument();
  });

  test('does not show the placeholder when a hash is present', () => {
    renderCell(row());

    expect(screen.queryByText(UNAVAILABLE_VALUE)).not.toBeInTheDocument();
  });

  test('renders nothing without a row', () => {
    const { container } = renderCell(null);

    expect(container).toBeEmptyDOMElement();
  });
});
