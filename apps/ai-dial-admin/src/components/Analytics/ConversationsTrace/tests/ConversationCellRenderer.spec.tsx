import { render, screen } from '@testing-library/react';
import { ICellRendererParams } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import ConversationCellRenderer from '@/src/components/Analytics/ConversationsTrace/List/ConversationCellRenderer';
import { ConversationRow } from '@/src/models/analytics/conversations-trace';

const CHAT_ID = '9f2c4b17-6d3a-4e58-b0c1-7ae95f83d204';

const row = (overrides: Partial<ConversationRow> = {}): ConversationRow => ({
  chat_id: CHAT_ID,
  project: 'data-team',
  turns: 3,
  tokens: 10240,
  cost: '0.090342871559',
  last_activity: '2026-07-28T09:41:12.318Z',
  first_activity: '2026-07-28T09:35:12.318Z',
  model: 'gpt-4o',
  model_count: 1,
  rating_up: 0,
  rating_down: 0,
  title: 'Refund policy for annual plans',
  snippet: 'A customer wants a partial refund three months into an annual subscription.',
  ...overrides,
});

const renderCell = (data?: ConversationRow | null) =>
  render(<ConversationCellRenderer {...({ data } as ICellRendererParams<ConversationRow>)} />);

describe('ConversationCellRenderer :: fully enriched row', () => {
  test('shows the title and the snippet', () => {
    const data = row();
    renderCell(data);

    expect(screen.getByText(data.title as string)).toBeInTheDocument();
    expect(screen.getByText(data.snippet as string)).toBeInTheDocument();
  });

  test('drops the id once both enrichment values fill the two lines', () => {
    renderCell(row());

    expect(screen.queryByText(CHAT_ID)).not.toBeInTheDocument();
  });

  test('shows nothing beyond the title and the snippet', () => {
    const data = row();
    const { container } = renderCell(data);

    expect(container.textContent).toBe(`${data.title}${data.snippet}`);
  });
});

describe('ConversationCellRenderer :: partially enriched rows', () => {
  test('falls back to the id alone when neither value is present', () => {
    renderCell(row({ title: null, snippet: null }));

    expect(screen.getByText(CHAT_ID)).toBeInTheDocument();
    expect(screen.queryAllByText(CHAT_ID)).toHaveLength(1);
  });

  test('shows a title with the id beneath it when the snippet is missing', () => {
    const data = row({ snippet: null });
    renderCell(data);

    expect(screen.getByText(data.title as string)).toBeInTheDocument();
    expect(screen.getByText(CHAT_ID)).toBeInTheDocument();
  });

  test('shows the id in place of a missing title, with the snippet beneath', () => {
    const data = row({ title: null });
    renderCell(data);

    expect(screen.getByText(CHAT_ID)).toBeInTheDocument();
    expect(screen.getByText(data.snippet as string)).toBeInTheDocument();
  });

  test.each([
    ['empty title', { title: '' }],
    ['empty snippet', { snippet: '' }],
    ['both empty', { title: '', snippet: '' }],
  ])('treats an %s as absent rather than rendering a blank line', (_label, overrides) => {
    renderCell(row(overrides));

    expect(screen.getByText(CHAT_ID)).toBeInTheDocument();
    expect(screen.queryAllByText(CHAT_ID)).toHaveLength(1);
  });
});

describe('ConversationCellRenderer :: no usable row', () => {
  test.each([
    ['no data', undefined],
    ['null data', null],
  ])('renders nothing for %s', (_label, data) => {
    const { container } = renderCell(data as ConversationRow | null);

    expect(container).toBeEmptyDOMElement();
  });

  test('renders nothing when the conversation id is empty', () => {
    const { container } = renderCell(row({ chat_id: '' }));

    expect(container).toBeEmptyDOMElement();
  });
});
