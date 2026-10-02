import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import EntityUsageDashboard from '@/src/components/Analytics/Usage/EntityUsageDashboard';
import { AnalyticsUsageI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { StructuredQuery } from '@/src/models/analytics/query';
import { ApplicationRoute } from '@/src/types/routes';

const runQueryMock = vi.fn();
const RUNNER = { runQuery: (...args: unknown[]) => runQueryMock(...args), runSql: vi.fn() };
vi.mock('@/src/components/Analytics/Common/use-analytics-query', () => ({
  useAnalyticsQuery: () => RUNNER,
}));

const isForbiddenMock = vi.fn();
vi.mock('@/src/app/[lang]/dashboards/actions', () => ({
  getIsAnalyticsForbidden: () => isForbiddenMock(),
}));

vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification: vi.fn(), removeNotification: vi.fn() }),
}));

// AG Grid and ECharts are the heavy children; this spec is about the dashboard's wiring.
vi.mock('@/src/components/Grid/GridView/GridView', () => ({ default: () => <div role="grid" /> }));
vi.mock('@/src/components/Common/HeatMap/HeatMapGrid', () => ({ default: () => <div role="grid" /> }));

const queriesSent = (): StructuredQuery[] => runQueryMock.mock.calls.map(([query]) => query as StructuredQuery);

const renderModel = () => render(<EntityUsageDashboard route={ApplicationRoute.Models} entity={{ name: 'gpt-4o' }} />);

beforeEach(() => {
  runQueryMock.mockReset();
  runQueryMock.mockResolvedValue({ isSuccess: true, result: { rows: [] } });
  isForbiddenMock.mockReset();
  isForbiddenMock.mockResolvedValue(false);
});

describe('EntityUsageDashboard', () => {
  test("offers View by with a model's one view, as the page does", async () => {
    const user = userEvent.setup();
    renderModel();

    await user.click(await screen.findByRole('combobox', { name: AnalyticsUsageI18nKey.ViewByLabel }));

    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([AnalyticsUsageI18nKey.ViewLlm]);
    expect(screen.getByRole('combobox', { name: AnalyticsUsageI18nKey.CompareLabel })).toBeTruthy();
  });

  test('leaves out the tab that would rank the model against itself', async () => {
    renderModel();

    await screen.findByRole('combobox', { name: AnalyticsUsageI18nKey.ViewByLabel });

    expect(screen.queryByText(AnalyticsUsageI18nKey.BreakdownTabModels)).toBeNull();
    expect(screen.getAllByText(AnalyticsUsageI18nKey.BreakdownTabApplications).length).toBeGreaterThan(0);
  });

  test("narrows every request to the model's own calls", async () => {
    renderModel();

    await waitFor(() => expect(runQueryMock).toHaveBeenCalled());

    for (const query of queriesSent()) {
      expect(JSON.stringify(query.filter)).toContain('"value":"gpt-4o"');
    }
  });

  test('reads no calls the model made, having none', async () => {
    renderModel();

    await waitFor(() => expect(runQueryMock).toHaveBeenCalled());

    for (const query of queriesSent()) {
      expect(JSON.stringify(query.filter)).not.toContain('"name":"parent_deployment"');
    }
  });

  test('ranks its share chart by caller, never by the model it is scoped to', async () => {
    renderModel();

    await waitFor(() => expect(runQueryMock).toHaveBeenCalled());

    const groupings = queriesSent().flatMap((query) => query.group_by ?? []);
    expect(groupings).toContain('parent_deployment');
    expect(groupings).not.toContain('deployment');
  });

  test('starts from the shared Audit period and writes a new one back', async () => {
    const user = userEvent.setup();
    const onTimeFilterChange = vi.fn();
    render(
      <EntityUsageDashboard
        route={ApplicationRoute.Models}
        entity={{ name: 'gpt-4o' }}
        defaultTimeFilter="7d"
        onTimeFilterChange={onTimeFilterChange}
      />,
    );

    await user.click(await screen.findByText(/Last 7d/i));
    await user.click(screen.getByText(/Last 1h/i));

    expect(onTimeFilterChange).toHaveBeenCalledWith('1h');
  });

  test('reads nothing until the access check has answered, and states a refusal', async () => {
    isForbiddenMock.mockResolvedValue(true);
    renderModel();

    expect(await screen.findByText(ErrorI18nKey.AccessForbidden)).toBeTruthy();
    expect(runQueryMock).not.toHaveBeenCalled();
  });

  test('reads nothing for an entity it cannot name', async () => {
    render(<EntityUsageDashboard route={ApplicationRoute.Models} entity={{}} />);

    await waitFor(() => expect(isForbiddenMock).toHaveBeenCalled());

    expect(runQueryMock).not.toHaveBeenCalled();
  });
});

describe('EntityUsageDashboard on an application', () => {
  const renderApplication = (routes?: unknown) =>
    render(
      <EntityUsageDashboard
        route={ApplicationRoute.Applications}
        entity={{ name: 'rag', routes } as unknown as Parameters<typeof EntityUsageDashboard>[0]['entity']}
      />,
    );

  const optionsOf = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(await screen.findByRole('combobox', { name: AnalyticsUsageI18nKey.ViewByLabel }));

    return screen.getAllByRole('option').map((option) => option.textContent);
  };

  test('offers LLM and MCP, and Routes only for an application that declares routes', async () => {
    const user = userEvent.setup();
    const { unmount } = renderApplication();

    expect(await optionsOf(user)).toEqual([AnalyticsUsageI18nKey.ViewLlm, AnalyticsUsageI18nKey.ViewMcp]);
    unmount();

    renderApplication([{ paths: ['/search'] }]);

    expect(await optionsOf(user)).toEqual([
      AnalyticsUsageI18nKey.ViewLlm,
      AnalyticsUsageI18nKey.ViewMcp,
      AnalyticsUsageI18nKey.ViewRoutes,
    ]);
  });

  test('switches to the MCP view, reading the tool calls the application made', async () => {
    const user = userEvent.setup();
    renderApplication();

    await optionsOf(user);
    runQueryMock.mockClear();
    await user.click(screen.getByRole('option', { name: AnalyticsUsageI18nKey.ViewMcp }));

    await waitFor(() => expect(runQueryMock).toHaveBeenCalled());
    for (const query of queriesSent()) {
      expect(JSON.stringify(query.filter)).toContain('"name":"parent_deployment"');
    }
  });

  test('reads its own calls with their total price, and the calls it made with their own', async () => {
    renderApplication();

    await waitFor(() => expect(runQueryMock).toHaveBeenCalled());
    const sent = queriesSent().map((query) => JSON.stringify(query));

    expect(sent.some((query) => query.includes('total_price') && query.includes('"name":"deployment"'))).toBe(true);
    expect(sent.some((query) => query.includes('"name":"parent_deployment"'))).toBe(true);
  });

  test('says its token card counts direct model calls', async () => {
    renderApplication();

    expect(await screen.findByText(AnalyticsUsageI18nKey.KpiTokensDirectCalls)).toBeTruthy();
  });
});
