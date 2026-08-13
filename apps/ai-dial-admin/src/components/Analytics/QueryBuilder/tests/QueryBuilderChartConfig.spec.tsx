import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { executeQuery } from '@/src/app/[lang]/queries/actions';
import QueryBuilder from '@/src/components/Analytics/QueryBuilder/QueryBuilder';
import { TEST_FUNCTIONS } from '@/src/components/Analytics/QueryBuilder/utils/tests/functions.fixture';
import { AnalyticsEntity, AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { ChartConfig, ChartType, QueryResultView } from '@/src/models/analytics/query-builder';

vi.mock('@/src/app/[lang]/queries/actions');

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: vi.fn(() => ({ featureFlags: { deploymentsEnabled: true } })),
}));

vi.mock('@/src/components/Analytics/QueryBuilder/Sql/SqlEditor', () => ({
  default: () => <textarea aria-label="sql-editor" />,
}));

vi.mock('@/src/components/Common/JsonEditorBase/JsonEditorBase', () => ({
  default: () => <textarea aria-label="json-editor" />,
}));

vi.mock('@/src/components/Analytics/QueryBuilder/Result/ResultArea', () => ({
  default: ({
    view,
    onChangeView,
    chartConfig,
    onChangeChartConfig,
  }: {
    view: QueryResultView;
    onChangeView: (view: QueryResultView) => void;
    chartConfig: ChartConfig;
    onChangeChartConfig: (config: ChartConfig) => void;
  }) => (
    <div>
      <span>view: {view}</span>
      <span>axis: {chartConfig.xField ?? 'none'}</span>
      <button onClick={() => onChangeView(QueryResultView.Chart)}>pick chart view</button>
      <button onClick={() => onChangeChartConfig({ type: ChartType.Bar, xField: 'project_id', yField: 'count' })}>
        pick axis
      </button>
    </div>
  ),
}));

const ENTITIES: AnalyticsEntity[] = [{ name: 'dial_usage_log' }];
const FIELDS: AnalyticsEntityField[] = [
  { name: 'project_id', type: AnalyticsFieldType.String, source: 'project_id', tag: 'lineage' },
  { name: 'request_time', type: AnalyticsFieldType.Timestamp, source: 'request_time', tag: 'identity' },
];

const renderBuilder = () =>
  render(
    <QueryBuilder
      initialEntities={ENTITIES}
      initialEntityName="dial_usage_log"
      initialFields={FIELDS}
      initialFunctions={TEST_FUNCTIONS}
    />,
  );

describe('QueryBuilder — result view and chart configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(executeQuery).mockImplementation(() =>
      Promise.resolve({ success: true, response: { columns: ['project_id'], rows: [{ project_id: 'a' }] } }),
    );
  });

  test('owns the result view, so a save can read what the author last looked at', async () => {
    const user = userEvent.setup();
    renderBuilder();

    expect(screen.getByText(`view: ${QueryResultView.Table}`)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'pick chart view' }));

    expect(screen.getByText(`view: ${QueryResultView.Chart}`)).toBeInTheDocument();
  });

  test('owns the chart configuration, so a save can read the chosen axes', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole('button', { name: 'pick axis' }));

    expect(screen.getByText('axis: project_id')).toBeInTheDocument();
  });

  test('resets the chart configuration on a new result, because axes belong to one query', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole('button', { name: /QueryBuilder.Run/ }));
    await screen.findByText('axis: none');
    await user.click(screen.getByRole('button', { name: 'pick axis' }));
    expect(screen.getByText('axis: project_id')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /QueryBuilder.Run/ }));

    expect(await screen.findByText('axis: none')).toBeInTheDocument();
  });

  test('keeps the result view across a run — it is a stored preference, not per-result state', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole('button', { name: 'pick chart view' }));
    await user.click(screen.getByRole('button', { name: /QueryBuilder.Run/ }));

    expect(await screen.findByText(`view: ${QueryResultView.Chart}`)).toBeInTheDocument();
  });
});
