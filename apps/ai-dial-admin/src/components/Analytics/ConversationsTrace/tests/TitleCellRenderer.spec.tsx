import { render, screen } from '@testing-library/react';
import { ICellRendererParams } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import TitleCellRenderer from '@/src/components/Analytics/ConversationsTrace/List/TitleCellRenderer';
import { ConversationRow } from '@/src/models/analytics/conversations-trace';

const CHAT_ID = 'Lrr0e6L5bpTND3IY_dN0_';

const row = (overrides: Partial<ConversationRow> = {}): ConversationRow => ({
  chat_id: CHAT_ID,
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
  render(<TitleCellRenderer {...({ data } as ICellRendererParams<ConversationRow>)} />);

describe('TitleCellRenderer', () => {
  test('shows the title the insight enrichment carries', () => {
    renderCell(row({ 'conversation_insights.title': 'Refund policy for EU orders' }));

    expect(screen.getByText('Refund policy for EU orders')).toBeInTheDocument();
  });

  test('falls back to the conversation id when no title exists', () => {
    renderCell(row());

    expect(screen.getByText(CHAT_ID)).toBeInTheDocument();
  });

  test.each([[null], ['']])('treats %p as no title', (title) => {
    renderCell(row({ 'conversation_insights.title': title }));

    expect(screen.getByText(CHAT_ID)).toBeInTheDocument();
  });

  test('renders nothing without a row', () => {
    const { container } = renderCell(null);

    expect(container).toBeEmptyDOMElement();
  });
});
