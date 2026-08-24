import { render, screen } from '@testing-library/react';
import { ICellRendererParams } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import RatingCellRenderer from '@/src/components/Analytics/ConversationsTrace/List/RatingCellRenderer';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { ConversationRow } from '@/src/models/analytics/conversations-trace';

const row = (rating_up: number | null, rating_down: number | null): ConversationRow => ({
  chat_id: 'chat-1',
  first_request_time: 0,
  project_id: 'data-team',
  user_hash: 'db7327ba3decd351',
  turn_count: 3,
  total_tokens: 10,
  total_price: '0.1',
  last_request_time: 1,
  rating_up,
  rating_down,
});

const renderCell = (data?: ConversationRow | null) =>
  render(<RatingCellRenderer {...({ data } as ICellRendererParams<ConversationRow>)} />);

const up = () => screen.getByText(ConversationsTraceI18nKey.RatingUp).parentElement;
const down = () => screen.getByText(ConversationsTraceI18nKey.RatingDown).parentElement;

describe('RatingCellRenderer', () => {
  test('always shows both a positive and a negative count, as the design does', () => {
    renderCell(row(2, 0));

    expect(up()).toHaveTextContent('2');
    expect(down()).toHaveTextContent('0');
  });

  test('shows a zero rather than hiding the side with no ratings', () => {
    renderCell(row(0, 1));

    expect(up()).toHaveTextContent('0');
    expect(down()).toHaveTextContent('1');
  });

  test('shows both counts for a conversation rated in both directions', () => {
    renderCell(row(3, 2));

    expect(up()).toHaveTextContent('3');
    expect(down()).toHaveTextContent('2');
  });

  test('colours a non-zero positive count as success and leaves a zero muted', () => {
    renderCell(row(2, 0));

    expect(up()).toHaveClass('text-success');
    expect(down()).toHaveClass('text-secondary');
  });

  test('colours a non-zero negative count as error and leaves a zero muted', () => {
    renderCell(row(0, 1));

    expect(down()).toHaveClass('text-error');
    expect(up()).toHaveClass('text-secondary');
  });

  test('colours each side independently when both carry ratings', () => {
    renderCell(row(1, 1));

    expect(up()).toHaveClass('text-success');
    expect(down()).toHaveClass('text-error');
  });

  test('mutes both sides for an unrated conversation', () => {
    renderCell(row(0, 0));

    expect(up()).toHaveClass('text-secondary');
    expect(down()).toHaveClass('text-secondary');
  });

  test('fills the icon of a side that carries ratings and outlines the one that does not', () => {
    renderCell(row(2, 0));

    expect(up().querySelector('svg')?.getAttribute('class')).not.toBe(
      down().querySelector('svg')?.getAttribute('class'),
    );
  });

  test('names each side for assistive technology, since the icons carry the meaning', () => {
    renderCell(row(1, 0));

    expect(up()).toBeInTheDocument();
    expect(down()).toBeInTheDocument();
  });

  test.each([
    ['an unresolved positive count', null, 0],
    ['an unresolved negative count', 0, null],
    ['both unresolved', null, null],
  ])('renders nothing for %s, rather than claiming zero ratings', (_label, upCount, downCount) => {
    const { container } = renderCell(row(upCount, downCount));

    expect(container).toBeEmptyDOMElement();
  });

  test('renders nothing without a row', () => {
    const { container } = renderCell(undefined);

    expect(container).toBeEmptyDOMElement();
  });
});
