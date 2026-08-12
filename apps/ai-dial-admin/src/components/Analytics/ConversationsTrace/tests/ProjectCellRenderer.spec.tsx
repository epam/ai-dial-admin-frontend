import { render, screen } from '@testing-library/react';
import { ICellRendererParams } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import ProjectCellRenderer from '@/src/components/Analytics/ConversationsTrace/List/ProjectCellRenderer';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { ConversationRow } from '@/src/models/analytics/conversations-trace';

const row = (overrides: Partial<ConversationRow> = {}): ConversationRow => ({
  chat_id: 'chat-1',
  project_id: 'internal-copilot',
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
  render(<ProjectCellRenderer {...({ data } as ICellRendererParams<ConversationRow>)} />);

describe('ProjectCellRenderer', () => {
  test('shows the project', () => {
    renderCell(row());

    expect(screen.getByText('internal-copilot')).toBeInTheDocument();
  });

  // The rollup does not carry `deployment`, so the page has no model to attribute to a conversation.
  test('shows no model chip and no model count', () => {
    const { container } = renderCell(row());

    expect(screen.queryByText('gpt-4o')).not.toBeInTheDocument();
    expect(screen.queryByText(/^\+\d/)).not.toBeInTheDocument();
    expect(container.querySelector('.rounded-full')).not.toBeInTheDocument();
  });

  // A third of real conversations carry no project, and a blank cell there reads as a rendering fault.
  test('marks an unattributed project rather than rendering an empty cell', () => {
    renderCell(row({ project_id: '' }));

    expect(screen.getByText(ConversationsTraceI18nKey.NoProject)).toBeInTheDocument();
  });

  test('does not show the placeholder when a project is present', () => {
    renderCell(row());

    expect(screen.queryByText(ConversationsTraceI18nKey.NoProject)).not.toBeInTheDocument();
  });

  test('renders nothing without a row', () => {
    const { container } = renderCell(null);

    expect(container).toBeEmptyDOMElement();
  });
});
