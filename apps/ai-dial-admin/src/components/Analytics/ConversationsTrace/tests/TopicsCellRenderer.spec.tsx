import { render, screen } from '@testing-library/react';
import { ICellRendererParams } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import TopicsCellRenderer from '@/src/components/Analytics/ConversationsTrace/List/TopicsCellRenderer';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { ConversationListRow, ConversationsField } from '@/src/models/analytics/conversations-trace';

const row = (topics?: unknown): ConversationListRow =>
  ({
    chat_id: '7ab178e9-f72c-43b4-8b58-23caefc3594b',
    ...(topics === undefined ? {} : { [ConversationsField.InsightTopics]: topics }),
  }) as ConversationListRow;

const renderCell = (topics?: unknown) =>
  render(<TopicsCellRenderer {...({ data: row(topics) } as ICellRendererParams<ConversationListRow>)} />);

describe('TopicsCellRenderer', () => {
  test('renders each topic as its own chip', () => {
    renderCell('security, code review, validation');

    expect(screen.getAllByText('security').length).toBeGreaterThan(0);
    expect(screen.getAllByText('code review').length).toBeGreaterThan(0);
    expect(screen.getAllByText('validation').length).toBeGreaterThan(0);
  });

  // The evaluator's own schema asks for a comma and a single space, and the model does not reliably produce
  // it — real rows carry both shapes, so the comma alone is the separator.
  test('splits on the comma whether or not a space follows it', () => {
    renderCell('capabilities,error');

    expect(screen.getAllByText('capabilities').length).toBeGreaterThan(0);
    expect(screen.getAllByText('error').length).toBeGreaterThan(0);
  });

  test('drops empty terms rather than rendering a blank chip', () => {
    renderCell('security,,  ,validation');

    expect(
      screen.getByRole('group', { name: `${ConversationsTraceI18nKey.Topics}: security, validation` }),
    ).toBeInTheDocument();
  });

  // The vocabulary belongs to an evaluator that can be re-versioned without this frontend knowing, so a term
  // the view does not expect is data rather than an error.
  test('renders an unrecognised term as it is stored', () => {
    renderCell('quantum-refactoring');

    expect(screen.getAllByText('quantum-refactoring').length).toBeGreaterThan(0);
  });

  // Colour and position alone do not say what a set of chips is, so the group carries the label and the whole
  // list — which is also what keeps an overflowing set reachable.
  test('names the group and carries every topic in its accessible name', () => {
    renderCell('security, code review, validation');

    expect(
      screen.getByRole('group', {
        name: `${ConversationsTraceI18nKey.Topics}: security, code review, validation`,
      }),
    ).toBeInTheDocument();
  });

  // Under a quarter of conversations carry an insight row, so this is the common case rather than an edge.
  // A dash or a zero would state that the evaluator looked and found no topic.
  test('renders nothing at all for a conversation the evaluation has not reached', () => {
    const { container } = renderCell(undefined);

    expect(container).toBeEmptyDOMElement();
  });

  test('renders nothing for a value that holds no terms', () => {
    const { container } = renderCell('  ,  ');

    expect(container).toBeEmptyDOMElement();
  });

  test('renders nothing for a null value', () => {
    const { container } = renderCell(null);

    expect(container).toBeEmptyDOMElement();
  });
});
