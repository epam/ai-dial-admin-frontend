import { render, screen } from '@testing-library/react';
import { ICellRendererParams } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import ProjectCellRenderer from '@/src/components/Analytics/ConversationsTrace/List/ProjectCellRenderer';
import { ConversationRow } from '@/src/models/analytics/conversations-trace';

const row = (overrides: Partial<ConversationRow> = {}): ConversationRow => ({
  chat_id: 'chat-1',
  project: 'internal-copilot',
  turns: 3,
  tokens: 7200,
  cost: '0.065',
  last_activity: 1,
  first_activity: 1,
  model: 'gpt-4o',
  model_count: 1,
  title: null,
  snippet: null,
  rating_up: 0,
  rating_down: 0,
  ...overrides,
});

const renderCell = (data?: ConversationRow | null) =>
  render(<ProjectCellRenderer {...({ data } as ICellRendererParams<ConversationRow>)} />);

describe('ProjectCellRenderer', () => {
  test('shows the project above the model', () => {
    renderCell(row());

    expect(screen.getByText('internal-copilot')).toBeInTheDocument();
    expect(screen.getByText('gpt-4o')).toBeInTheDocument();
  });

  test('gives the model a colour dot from the theme tokens', () => {
    const { container } = renderCell(row());

    expect(container.querySelector('.rounded-full')?.className).toMatch(/bg-accent-/);
  });

  test('shows no extra-model count for a conversation that used one model', () => {
    renderCell(row({ model_count: 1 }));

    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  // min(deployment) reports one model, so a conversation spanning several must say so rather than imply one.
  test('reports the other models when a conversation used more than one', () => {
    renderCell(row({ model_count: 3 }));

    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  test('reads a model count that arrives as a string', () => {
    renderCell(row({ model_count: '2' }));

    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  test('shows the project alone when no model is known', () => {
    renderCell(row({ model: null }));

    expect(screen.getByText('internal-copilot')).toBeInTheDocument();
    expect(screen.queryByText('gpt-4o')).not.toBeInTheDocument();
  });

  test('renders an empty project without crashing, since project_id defaults to an empty string', () => {
    renderCell(row({ project: '' }));

    expect(screen.getByText('gpt-4o')).toBeInTheDocument();
  });

  test('renders nothing without a row', () => {
    const { container } = renderCell(undefined);

    expect(container).toBeEmptyDOMElement();
  });
});
