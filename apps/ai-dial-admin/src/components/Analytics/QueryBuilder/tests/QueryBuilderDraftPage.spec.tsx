import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getEntitySchema } from '@/src/app/[lang]/queries/actions';
import QueryBuilderDraftPage from '@/src/components/Analytics/QueryBuilder/QueryBuilderDraftPage';
import { SourcePanelProvider } from '@/src/components/Analytics/QueryBuilder/SourcePanel/context';
import { SourceTable } from '@/src/components/Analytics/QueryBuilder/SourcePanel/models';
import { AnalyticsEntity, AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';

vi.mock('@/src/app/[lang]/queries/actions');

vi.mock('@/src/components/Analytics/QueryBuilder/QueryBuilderDraft', () => ({
  default: ({
    initialEntityName,
    initialFields,
  }: {
    initialEntityName: string;
    initialFields: AnalyticsEntityField[];
  }) => (
    <div>
      draft on {initialEntityName || 'no table'}: {initialFields.map((field) => field.name).join(', ') || 'no fields'}
    </div>
  ),
}));

const ENTITIES: AnalyticsEntity[] = [{ name: 'conversation' }, { name: 'dial_usage_log' }];
const TABLES: SourceTable[] = [{ name: 'conversation' }, { name: 'dial_usage_log' }];
const CONVERSATION_FIELDS: AnalyticsEntityField[] = [
  { name: 'chat_id', type: AnalyticsFieldType.String, source: 'chat_id' },
];
const USAGE_FIELDS: AnalyticsEntityField[] = [
  { name: 'deployment', type: AnalyticsFieldType.String, source: 'deployment' },
];

const renderDraftPage = (entities: AnalyticsEntity[] = ENTITIES) =>
  render(
    <SourcePanelProvider tables={TABLES} queries={[]}>
      <QueryBuilderDraftPage
        initialEntities={entities}
        initialEntityName={entities[0]?.name ?? ''}
        initialFields={entities.length ? CONVERSATION_FIELDS : []}
        initialFunctions={[]}
      />
    </SourcePanelProvider>,
  );

describe('QueryBuilderDraftPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(getEntitySchema).mockResolvedValue({ success: true, response: { fields: USAGE_FIELDS } });
  });

  test('builds the draft on the first table from the schema it was given', () => {
    renderDraftPage();

    expect(screen.getByText('draft on conversation: chat_id')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'conversation' })).toHaveAttribute('aria-current', 'page');
    expect(getEntitySchema).not.toHaveBeenCalled();
  });

  test('rebuilds the draft on a table picked in the Source panel, reading its schema', async () => {
    const user = userEvent.setup();
    renderDraftPage();

    await user.click(screen.getByRole('link', { name: 'dial_usage_log' }));

    expect(await screen.findByText('draft on dial_usage_log: deployment')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'dial_usage_log' })).toHaveAttribute('aria-current', 'page');
    expect(getEntitySchema).toHaveBeenCalledExactlyOnceWith('dial_usage_log');
  });

  test('builds the draft without fields when the picked table schema cannot be read', async () => {
    const user = userEvent.setup();
    vi.mocked(getEntitySchema).mockResolvedValue({ success: false, status: 500 });
    renderDraftPage();

    await user.click(screen.getByRole('link', { name: 'dial_usage_log' }));

    expect(await screen.findByText('draft on dial_usage_log: no fields')).toBeInTheDocument();
  });

  test('returns to the first table when it is picked again, without another read', async () => {
    const user = userEvent.setup();
    renderDraftPage();
    await user.click(screen.getByRole('link', { name: 'dial_usage_log' }));
    await screen.findByText('draft on dial_usage_log: deployment');

    await user.click(screen.getByRole('link', { name: 'conversation' }));

    expect(await screen.findByText('draft on conversation: chat_id')).toBeInTheDocument();
    expect(getEntitySchema).toHaveBeenCalledOnce();
  });

  test('builds an empty draft when no table is queryable', () => {
    renderDraftPage([]);

    expect(screen.getByText('draft on no table: no fields')).toBeInTheDocument();
  });
});
