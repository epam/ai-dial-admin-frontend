import { render, screen } from '@testing-library/react';
import { ICellRendererParams } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import SessionCellRenderer from '@/src/components/Analytics/SessionsTrace/List/SessionCellRenderer';
import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/sessions-trace';
import { SessionRow } from '@/src/models/analytics/sessions-trace';

const CHAT_ID = '7ab178e9-f72c-43b4-8b58-23caefc3594b';

const row = (overrides: Partial<SessionRow> = {}): SessionRow => ({
  client_session_id: CHAT_ID,
  project_id: 'data-team',
  user_hash: 'db7327ba3decd351',
  turn_count: 13,
  total_tokens: 979030,
  total_price: '3.014346',
  last_request_time: 1,
  first_request_time: 0,
  rating_up: 0,
  rating_down: 0,
  ...overrides,
});

const renderCell = (data?: SessionRow | null) =>
  render(<SessionCellRenderer {...({ data } as ICellRendererParams<SessionRow>)} />);

describe('SessionCellRenderer', () => {
  test('shows the session id', () => {
    renderCell(row());

    expect(screen.getByText(CHAT_ID)).toBeInTheDocument();
  });

  // The cell is the session's whole identity: its name above, its id below.
  test('shows the insight title above the id', () => {
    renderCell(row({ 'session_insights.title': 'Poland GDP for 2024' } as Partial<SessionRow>));

    expect(screen.getByText('Poland GDP for 2024')).toBeInTheDocument();
    expect(screen.getByText(CHAT_ID)).toBeInTheDocument();
  });

  // Substituting the id would print it on both lines, and read as though the session were named
  // after its own hash — which is what most of them would show, the enrichment reaching few of them.
  test.each([
    ['no title field', undefined],
    ['a null title', null],
    ['a whitespace-only title', '   '],
  ])('marks the title unavailable rather than repeating the id for %s', (_label, title) => {
    renderCell(row({ 'session_insights.title': title } as Partial<SessionRow>));

    expect(screen.getByText(UNAVAILABLE_VALUE)).toBeInTheDocument();
    expect(screen.getAllByText(CHAT_ID)).toHaveLength(1);
  });

  // Real ids run from 21 to several hundred characters, some of them URL-like rather than opaque ids.
  test('keeps a long id reachable rather than only truncating it', () => {
    const longId = `${'9m4JMektXTE1v1UxkuWzZ2kBJcgRqgXDrVVuatmvVPqy'}/en/what%20is%20the%20latest%20forecast`;
    renderCell(row({ client_session_id: longId }));

    expect(screen.getByText(longId)).toBeInTheDocument();
  });

  test.each([
    ['no data', undefined],
    ['null data', null],
  ])('renders nothing for %s', (_label, data) => {
    const { container } = renderCell(data as SessionRow | null | undefined);

    expect(container).toBeEmptyDOMElement();
  });

  test('renders nothing when the session id is empty', () => {
    const { container } = renderCell(row({ client_session_id: '' }));

    expect(container).toBeEmptyDOMElement();
  });
});
