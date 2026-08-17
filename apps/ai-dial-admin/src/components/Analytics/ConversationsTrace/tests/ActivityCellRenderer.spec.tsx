import { render, screen } from '@testing-library/react';
import { ICellRendererParams } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import ActivityCellRenderer from '@/src/components/Analytics/ConversationsTrace/List/ActivityCellRenderer';
import { ConversationRow } from '@/src/models/analytics/conversations-trace';

const NOW = Date.parse('2026-07-28T12:00:00.000Z');
const MINUTE = 60 * 1000;

const row = (overrides: Partial<ConversationRow> = {}): ConversationRow => ({
  chat_id: 'chat-1',
  project_id: 'data-team',
  user_hash: 'db7327ba3decd351',
  turn_count: 3,
  total_tokens: 10,
  total_price: '0.1',
  last_request_time: NOW - 12 * MINUTE,
  first_request_time: NOW - 18 * MINUTE,
  rating_up: 0,
  rating_down: 0,
  ...overrides,
});

const renderCell = (data?: ConversationRow | null) =>
  render(<ActivityCellRenderer {...({ data, nowMs: NOW } as unknown as ICellRendererParams<ConversationRow>)} />);

describe('ActivityCellRenderer', () => {
  test('shows how long ago the conversation was last active', () => {
    renderCell(row());

    expect(screen.getByText('12m ago')).toBeInTheDocument();
  });

  test('shows how long the conversation ran beneath it', () => {
    renderCell(row());

    expect(screen.getByText('6 min')).toBeInTheDocument();
  });

  // Relative time is easy to read but imprecise, so the absolute instant stays reachable.
  test('keeps the absolute timestamp available on hover', () => {
    renderCell(row());

    expect(screen.getByText('12m ago')).toHaveAttribute('title');
  });

  test('shows the relative time alone when the span cannot be computed', () => {
    renderCell(row({ first_request_time: null }));

    expect(screen.getByText('12m ago')).toBeInTheDocument();
    expect(screen.queryByText('6 min')).not.toBeInTheDocument();
  });

  test('reads an ISO timestamp as well as epoch millis', () => {
    renderCell(row({ last_request_time: new Date(NOW - 12 * MINUTE).toISOString() }));

    expect(screen.getByText('12m ago')).toBeInTheDocument();
  });

  test('renders nothing when there is no activity timestamp', () => {
    const { container } = renderCell(row({ last_request_time: null }));

    expect(container).toBeEmptyDOMElement();
  });

  test('renders nothing without a row', () => {
    const { container } = renderCell(undefined);

    expect(container).toBeEmptyDOMElement();
  });
});
