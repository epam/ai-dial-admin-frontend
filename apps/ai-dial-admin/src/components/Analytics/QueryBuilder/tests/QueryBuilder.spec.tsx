import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import QueryBuilder from '@/src/components/Analytics/QueryBuilder/QueryBuilder';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { AnalyticsEntity, AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';

vi.mock('@/src/app/[lang]/query-builder/actions');

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ rowData }: { rowData?: unknown[] }) => <div>grid rows: {rowData?.length ?? 0}</div>,
}));

const ENTITIES: AnalyticsEntity[] = [{ name: 'dial_usage_log' }];
const FIELDS: AnalyticsEntityField[] = [
  { name: 'event_id', type: AnalyticsFieldType.Uuid, source: 'event_id', tag: 'identity' },
  { name: 'project_id', type: AnalyticsFieldType.String, source: 'project_id', tag: 'lineage' },
];

const renderBuilder = (props?: Partial<Parameters<typeof QueryBuilder>[0]>) =>
  render(
    <QueryBuilder initialEntities={ENTITIES} initialEntityName="dial_usage_log" initialFields={FIELDS} {...props} />,
  );

beforeEach(() => {
  vi.clearAllMocks();
});

describe('QueryBuilder', () => {
  test('renders the builder for the server-provided schema', () => {
    renderBuilder();

    expect(screen.getByText(QueryBuilderI18nKey.Mode)).toBeInTheDocument();
    expect(screen.getByText('event_id')).toBeInTheDocument();
    expect(screen.getByText('project_id')).toBeInTheDocument();
  });

  test('projection tag filter narrows visible fields without changing selection', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByText('event_id'));
    await user.click(screen.getByText('lineage'));

    await waitFor(() => expect(screen.queryByText('event_id')).not.toBeInTheDocument());
    expect(screen.getByText('project_id')).toBeInTheDocument();
  });

  test('enables the header Run button when a schema is loaded', () => {
    renderBuilder();

    expect(screen.getByRole('button', { name: QueryBuilderI18nKey.Run })).toBeEnabled();
  });

  test('shows the empty state when no entities were provided', () => {
    renderBuilder({ initialEntities: [], initialEntityName: '', initialFields: [] });

    expect(screen.getByText(QueryBuilderI18nKey.EntitiesLoadFailed)).toBeInTheDocument();
    expect(screen.queryByText(QueryBuilderI18nKey.Mode)).not.toBeInTheDocument();
  });
});
