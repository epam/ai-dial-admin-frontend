import { render, screen } from '@testing-library/react';
import { ICellRendererParams } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import ConversationCellRenderer from '@/src/components/Analytics/ConversationsTrace/List/ConversationCellRenderer';
import { ConversationRow } from '@/src/models/analytics/conversations-trace';

const CHAT_ID = '7ab178e9-f72c-43b4-8b58-23caefc3594b';

const row = (overrides: Partial<ConversationRow> = {}): ConversationRow => ({
  chat_id: CHAT_ID,
  project_id: 'data-team',
  turn_count: 13,
  total_tokens: 979030,
  total_price: '3.014346',
  last_request_time: 1,
  first_request_time: 0,
  rating_up: 0,
  rating_down: 0,
  ...overrides,
});

const renderCell = (data?: ConversationRow | null) =>
  render(<ConversationCellRenderer {...({ data } as ICellRendererParams<ConversationRow>)} />);

describe('ConversationCellRenderer', () => {
  test('shows the conversation id', () => {
    renderCell(row());

    expect(screen.getByText(CHAT_ID)).toBeInTheDocument();
  });

  // No source supplies a conversation title or snippet, so the id is all the cell shows.
  test('shows nothing beyond the conversation id', () => {
    const { container } = renderCell(row());

    expect(container.textContent).toBe(CHAT_ID);
  });

  // Real ids run from 21 to several hundred characters, some of them URL-like rather than opaque ids.
  test('keeps a long id reachable rather than only truncating it', () => {
    const longId = `${'9m4JMektXTE1v1UxkuWzZ2kBJcgRqgXDrVVuatmvVPqy'}/en/what%20is%20the%20latest%20forecast`;
    renderCell(row({ chat_id: longId }));

    expect(screen.getByText(longId)).toBeInTheDocument();
  });

  test.each([
    ['no data', undefined],
    ['null data', null],
  ])('renders nothing for %s', (_label, data) => {
    const { container } = renderCell(data as ConversationRow | null | undefined);

    expect(container).toBeEmptyDOMElement();
  });

  test('renders nothing when the conversation id is empty', () => {
    const { container } = renderCell(row({ chat_id: '' }));

    expect(container).toBeEmptyDOMElement();
  });
});
