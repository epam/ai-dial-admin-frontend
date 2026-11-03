import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { ComponentProps } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { useDashboardWidgetData } from '@/src/components/Analytics/CustomDashboards/Widget/use-dashboard-widget-data';
import { ComparePeriod } from '@/src/components/Analytics/Usage/models';
import { getWeekRange } from '@/src/components/Analytics/Usage/utils/weeks';
import WidgetCard from '@/src/components/Analytics/CustomDashboards/Widget/WidgetCard';
import { ButtonsI18nKey, CustomDashboardsI18nKey } from '@/src/constants/i18n';
import { StructuredQuery, StructuredQueryResult } from '@/src/models/analytics/query';
import { ExecutedQueryMeta, QueryResultView } from '@/src/models/analytics/query-builder';
import { SavedQuery } from '@/src/models/analytics/saved-query';
import {
  DashboardWidget,
  WidgetMoveDirection,
  WidgetQuery,
  WidgetQueryKind,
  WidgetSize,
  WidgetView,
} from '@/src/models/analytics/dashboard';
import { ApplicationRoute } from '@/src/types/routes';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';

vi.mock('@/src/components/Analytics/CustomDashboards/Widget/use-dashboard-widget-data', () => ({
  useDashboardWidgetData: vi.fn(),
}));

// The result view mounts a grid or a chart; the card's own behaviour is what is under test here.
vi.mock('@/src/components/Analytics/CustomDashboards/Widget/WidgetResult', () => ({
  default: ({ savedQuery }: { savedQuery: SavedQuery }) => <p>{`result of ${savedQuery.name}`}</p>,
}));

type CardProps = ComponentProps<typeof WidgetCard>;

const push = vi.fn();
const onRetry = vi.fn();

const SAVED_QUERY = { id: 'q-1', name: 'Spend by model' } as SavedQuery;
const STRUCTURED: WidgetQuery = {
  kind: WidgetQueryKind.Structured,
  savedQuery: SAVED_QUERY,
  query: {} as StructuredQuery,
  fields: [],
};
const COMPOSITE: WidgetQuery = { kind: WidgetQueryKind.CompositeSql, savedQuery: SAVED_QUERY, sql: 'SELECT 1' };
const UNAVAILABLE: WidgetQuery = { kind: WidgetQueryKind.Unavailable };

const WIDGET: DashboardWidget = {
  id: 'w-1',
  saved_query_id: 'q-1',
  row_limit: 100,
  layout: { x: 0, y: 0, w: 6, h: 4 },
};

const RANGE = { startDate: new Date('2026-10-01T00:00:00Z'), endDate: new Date('2026-10-08T00:00:00Z') };

const loaded = () =>
  vi.mocked(useDashboardWidgetData).mockReturnValue({
    result: { rows: [] } as unknown as StructuredQueryResult,
    meta: {
      dimensionColumns: [],
      aggregateColumns: [],
      columnLabels: {},
      columnValueClasses: {},
    } as unknown as ExecutedQueryMeta,
    isLoading: false,
    hasFailed: false,
    isDenied: false,
    previousResult: null,
    onRetry,
  });

describe('WidgetCard', () => {
  const onEditSettings = vi.fn();
  const onRemove = vi.fn();
  const onMove = vi.fn();
  const onResize = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
    loaded();
  });

  const renderCard = (props: Partial<CardProps> = {}) =>
    render(
      <WidgetCard
        widget={WIDGET}
        widgetQuery={STRUCTURED}
        range={RANGE}
        compare={ComparePeriod.Off}
        isEditing={false}
        isFirst={false}
        isLast={false}
        onEditSettings={onEditSettings}
        onRemove={onRemove}
        onMove={onMove}
        onResize={onResize}
        {...props}
      />,
    );

  const openMenu = async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Actions }));
    return user;
  };

  test('heads an untitled widget with its saved query name', () => {
    renderCard();

    expect(screen.getByRole('region', { name: SAVED_QUERY.name })).toBeTruthy();
    expect(screen.getByRole('region', { name: SAVED_QUERY.name })).toBeTruthy();
  });

  test('heads a titled widget with its own title', () => {
    renderCard({ widget: { ...WIDGET, title: 'Weekly spend' } });

    expect(screen.getByRole('region', { name: 'Weekly spend' })).toBeTruthy();
  });

  test('renders the result once the data has loaded', () => {
    renderCard();

    expect(screen.getByText(`result of ${SAVED_QUERY.name}`)).toBeTruthy();
  });

  test('states the widget description under its title', () => {
    renderCard({ widget: { ...WIDGET, description: 'Spend per model' } });

    expect(screen.getByText('Spend per model')).toBeTruthy();
  });

  test('offers a single value widget description as a hint beside its title', () => {
    vi.mocked(useDashboardWidgetData).mockReturnValue({
      result: { rows: [{ spend: 345 }] } as StructuredQueryResult,
      meta: {
        dimensionColumns: [],
        aggregateColumns: ['spend'],
        columnLabels: {},
        columnValueClasses: {},
      } as unknown as ExecutedQueryMeta,
      previousResult: null,
      isLoading: false,
      hasFailed: false,
      isDenied: false,
      onRetry,
    });
    renderCard({ widget: { ...WIDGET, view: WidgetView.SingleValue, description: 'Spend per model' } });

    expect(screen.getByRole('button', { name: 'Spend per model' })).toBeTruthy();
  });

  test('passes the widget row limit and the dashboard range to its data hook', () => {
    renderCard({ widget: { ...WIDGET, row_limit: 25 } });

    expect(useDashboardWidgetData).toHaveBeenCalledWith({
      widgetQuery: STRUCTURED,
      rowLimit: 25,
      range: RANGE,
      period: undefined,
      previousRange: undefined,
    });
  });

  test('asks for the compared window for a single value while compare is on', () => {
    renderCard({ widget: { ...WIDGET, view: WidgetView.SingleValue }, compare: ComparePeriod.PreviousPeriod });

    expect(useDashboardWidgetData).toHaveBeenCalledWith(
      expect.objectContaining({
        previousRange: { startDate: new Date('2026-09-24T00:00:00Z'), endDate: new Date('2026-10-01T00:00:00Z') },
      }),
    );
  });

  test('draws a single value as a usage KPI card titled by its column', () => {
    vi.mocked(useDashboardWidgetData).mockReturnValue({
      result: { rows: [{ spend: 345 }] } as StructuredQueryResult,
      meta: {
        dimensionColumns: [],
        aggregateColumns: ['spend'],
        columnLabels: {},
        columnValueClasses: {},
      } as unknown as ExecutedQueryMeta,
      previousResult: null,
      isLoading: false,
      hasFailed: false,
      isDenied: false,
      onRetry,
    });
    renderCard({ widget: { ...WIDGET, view: WidgetView.SingleValue } });

    expect(screen.getByRole('region', { name: 'spend' })).toBeTruthy();
    expect(screen.getByText('345')).toBeTruthy();
    expect(screen.queryByText('result of Spend by model')).toBeNull();
  });

  test('reads the calendar week holding the range end for a heatmap, at the widget maximum', () => {
    renderCard({ widget: { ...WIDGET, view: WidgetView.Heatmap } });

    expect(useDashboardWidgetData).toHaveBeenCalledWith(
      expect.objectContaining({ rowLimit: 1000, range: getWeekRange(0, RANGE.endDate), period: undefined }),
    );
  });

  test('reads the dashboard range once a heatmap week does not fit a heatmap', () => {
    renderCard({ widget: { ...WIDGET, view: WidgetView.Heatmap } });

    expect(useDashboardWidgetData).toHaveBeenLastCalledWith(
      expect.objectContaining({ rowLimit: WIDGET.row_limit, range: RANGE }),
    );
  });

  test('asks for the compared window for a query whose own view is a table', () => {
    renderCard({ compare: ComparePeriod.PreviousPeriod });

    expect(useDashboardWidgetData).toHaveBeenCalledWith(
      expect.objectContaining({ previousRange: expect.objectContaining({ endDate: RANGE.startDate }) }),
    );
  });

  test('asks for no compared window for a view that does not draw one', () => {
    renderCard({ widget: { ...WIDGET, view: WidgetView.Share }, compare: ComparePeriod.PreviousPeriod });

    expect(useDashboardWidgetData).toHaveBeenCalledWith(expect.objectContaining({ previousRange: undefined }));
  });

  test('marks a composite SQL widget with the own-range hint', () => {
    renderCard({ widgetQuery: COMPOSITE });

    expect(screen.getByRole('button', { name: CustomDashboardsI18nKey.CompositeSqlHint })).toBeTruthy();
  });

  test('carries no own-range hint on a structured widget', () => {
    renderCard();

    expect(screen.queryByRole('button', { name: CustomDashboardsI18nKey.CompositeSqlHint })).toBeNull();
  });

  test('shows an error state with Retry when its data fails, and retries on demand', async () => {
    vi.mocked(useDashboardWidgetData).mockReturnValue({
      result: null,
      meta: null,
      isLoading: false,
      hasFailed: true,
      isDenied: false,
      previousResult: null,
      onRetry,
    });
    renderCard();
    const user = userEvent.setup();

    expect(screen.getByText(CustomDashboardsI18nKey.WidgetLoadFailed)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: CustomDashboardsI18nKey.Retry }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  test('resolves the query again on Retry when resolving it failed, instead of rerunning it', async () => {
    vi.mocked(useDashboardWidgetData).mockReturnValue({
      result: null,
      meta: null,
      isLoading: false,
      hasFailed: true,
      isDenied: false,
      previousResult: null,
      onRetry,
    });
    const onRetryQuery = vi.fn();
    renderCard({ widgetQuery: { kind: WidgetQueryKind.Failed }, onRetryQuery });
    const user = userEvent.setup();

    expect(screen.getByText(CustomDashboardsI18nKey.WidgetLoadFailed)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: CustomDashboardsI18nKey.Retry }));

    expect(onRetryQuery).toHaveBeenCalledWith(WIDGET);
    expect(onRetry).not.toHaveBeenCalled();
  });

  test('shows no own-range hint before its first answer', () => {
    vi.mocked(useDashboardWidgetData).mockReturnValue({
      result: null,
      meta: null,
      isLoading: true,
      hasFailed: false,
      isDenied: false,
      previousResult: null,
      onRetry,
    });
    renderCard({ widgetQuery: COMPOSITE });

    expect(screen.queryByRole('button', { name: CustomDashboardsI18nKey.CompositeSqlHint })).toBeNull();
  });

  test('shows no result while its data loads', () => {
    vi.mocked(useDashboardWidgetData).mockReturnValue({
      result: null,
      meta: null,
      isLoading: true,
      hasFailed: false,
      isDenied: false,
      previousResult: null,
      onRetry,
    });
    renderCard();

    expect(screen.queryByText(`result of ${SAVED_QUERY.name}`)).toBeNull();
    expect(screen.queryByRole('button', { name: CustomDashboardsI18nKey.Retry })).toBeNull();
  });

  test('navigates to the saved query on Open query', async () => {
    renderCard();
    const user = await openMenu();

    await user.click(await screen.findByRole('menuitem', { name: CustomDashboardsI18nKey.OpenQuery }));

    expect(push).toHaveBeenCalledWith(getUrnForEntity(ApplicationRoute.AnalyticsQueries, { id: 'q-1' }));
  });

  test('offers only Open query in view mode', async () => {
    renderCard();
    await openMenu();

    expect(await screen.findByRole('menuitem', { name: CustomDashboardsI18nKey.OpenQuery })).toBeTruthy();
    expect(screen.queryByRole('menuitem', { name: CustomDashboardsI18nKey.RemoveWidget })).toBeNull();
    expect(screen.queryByRole('menuitem', { name: CustomDashboardsI18nKey.MoveUp })).toBeNull();
    expect(screen.queryByRole('menuitem', { name: CustomDashboardsI18nKey.WidgetSettings })).toBeNull();
  });
});

describe('WidgetCard — edit mode', () => {
  const onEditSettings = vi.fn();
  const onRemove = vi.fn();
  const onMove = vi.fn();
  const onResize = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
    loaded();
  });

  const renderEditing = (props: Partial<CardProps> = {}) =>
    render(
      <WidgetCard
        widget={WIDGET}
        widgetQuery={STRUCTURED}
        range={RANGE}
        compare={ComparePeriod.Off}
        isEditing
        isFirst={false}
        isLast={false}
        onEditSettings={onEditSettings}
        onRemove={onRemove}
        onMove={onMove}
        onResize={onResize}
        {...props}
      />,
    );

  const openMenu = async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Actions }));
    return user;
  };

  test('keeps the stored view in its settings while the first answer is on its way', async () => {
    vi.mocked(useDashboardWidgetData).mockReturnValue({
      result: null,
      meta: null,
      previousResult: null,
      isLoading: true,
      hasFailed: false,
      isDenied: false,
      onRetry,
    });
    renderEditing({ widget: { ...WIDGET, view: WidgetView.Share } });

    const user = await openMenu();
    await user.click(screen.getByRole('menuitem', { name: CustomDashboardsI18nKey.WidgetSettings }));

    expect(onEditSettings).toHaveBeenCalledWith('w-1', {
      fittingViews: [WidgetView.Query, WidgetView.Share],
      valueColumns: [],
    });
  });

  test('offers settings, moves, sizes and Remove', async () => {
    renderEditing();
    await openMenu();

    expect(await screen.findByRole('menuitem', { name: CustomDashboardsI18nKey.RemoveWidget })).toBeTruthy();
    for (const label of [
      CustomDashboardsI18nKey.OpenQuery,
      CustomDashboardsI18nKey.WidgetSettings,
      CustomDashboardsI18nKey.MoveUp,
      CustomDashboardsI18nKey.MoveDown,
      CustomDashboardsI18nKey.SizeSmall,
      CustomDashboardsI18nKey.SizeMedium,
      CustomDashboardsI18nKey.SizeLarge,
    ]) {
      expect(screen.getByRole('menuitem', { name: label })).toBeTruthy();
    }
  });

  test('offers no size for a single value widget, which keeps its own', async () => {
    renderEditing({ widget: { ...WIDGET, view: WidgetView.SingleValue } });
    await openMenu();

    expect(await screen.findByRole('menuitem', { name: CustomDashboardsI18nKey.RemoveWidget })).toBeTruthy();
    expect(screen.queryByRole('menuitem', { name: CustomDashboardsI18nKey.SizeSmall })).toBeNull();
    expect(screen.queryByRole('menuitem', { name: CustomDashboardsI18nKey.SizeLarge })).toBeNull();
  });

  test('makes Move up unavailable on the first widget', async () => {
    renderEditing({ isFirst: true });
    await openMenu();

    expect(await screen.findByRole('menuitem', { name: CustomDashboardsI18nKey.MoveUp })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('menuitem', { name: CustomDashboardsI18nKey.MoveDown })).not.toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  test('makes Move down unavailable on the last widget', async () => {
    renderEditing({ isLast: true });
    await openMenu();

    expect(await screen.findByRole('menuitem', { name: CustomDashboardsI18nKey.MoveDown })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  test('moves the widget down', async () => {
    renderEditing();
    const user = await openMenu();

    await user.click(await screen.findByRole('menuitem', { name: CustomDashboardsI18nKey.MoveDown }));

    expect(onMove).toHaveBeenCalledWith('w-1', WidgetMoveDirection.Down);
  });

  test('resizes the widget to Large', async () => {
    renderEditing();
    const user = await openMenu();

    await user.click(await screen.findByRole('menuitem', { name: CustomDashboardsI18nKey.SizeLarge }));

    expect(onResize).toHaveBeenCalledWith('w-1', WidgetSize.Large);
  });

  test('opens the widget settings', async () => {
    renderEditing();
    const user = await openMenu();

    await user.click(await screen.findByRole('menuitem', { name: CustomDashboardsI18nKey.WidgetSettings }));

    expect(onEditSettings).toHaveBeenCalledWith('w-1', {
      fittingViews: [WidgetView.Query, WidgetView.Table],
      valueColumns: [],
    });
  });

  test('still offers Remove for a widget whose saved query is gone', async () => {
    vi.mocked(useDashboardWidgetData).mockReturnValue({
      result: null,
      meta: null,
      isLoading: false,
      hasFailed: false,
      isDenied: true,
      previousResult: null,
      onRetry,
    });
    renderEditing({ widgetQuery: UNAVAILABLE });
    const user = await openMenu();

    await user.click(await screen.findByRole('menuitem', { name: CustomDashboardsI18nKey.RemoveWidget }));

    expect(onRemove).toHaveBeenCalledWith('w-1');
    expect(screen.getByText(CustomDashboardsI18nKey.WidgetUnavailable)).toBeTruthy();
  });
});

describe('WidgetCard — access', () => {
  const INLINE_WIDGET: DashboardWidget = {
    id: 'w-2',
    inline_query: { name: 'Inline spend', sql: 'SELECT 1', result_view: QueryResultView.Table },
    row_limit: 100,
    layout: { x: 0, y: 0, w: 6, h: 4 },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
    loaded();
  });

  const renderCard = (props: Partial<CardProps> = {}) =>
    render(
      <WidgetCard
        widget={WIDGET}
        widgetQuery={STRUCTURED}
        range={RANGE}
        compare={ComparePeriod.Off}
        isEditing={false}
        isFirst={false}
        isLast={false}
        onEditSettings={vi.fn()}
        onRemove={vi.fn()}
        onMove={vi.fn()}
        onResize={vi.fn()}
        {...props}
      />,
    );

  const denied = () =>
    vi.mocked(useDashboardWidgetData).mockReturnValue({
      result: null,
      meta: null,
      isLoading: false,
      hasFailed: true,
      isDenied: true,
      previousResult: null,
      onRetry,
    });

  test('shows the not-available placeholder with no Retry and no query name for an unreadable query', () => {
    denied();
    renderCard({ widgetQuery: UNAVAILABLE });

    expect(screen.getByText(CustomDashboardsI18nKey.WidgetUnavailable)).toBeTruthy();
    expect(screen.queryByText(CustomDashboardsI18nKey.WidgetLoadFailed)).toBeNull();
    expect(screen.queryByRole('button', { name: CustomDashboardsI18nKey.Retry })).toBeNull();
    expect(screen.queryByText(SAVED_QUERY.name)).toBeNull();
  });

  test('names nothing of a readable query whose data was refused', () => {
    denied();
    renderCard({ widgetQuery: STRUCTURED });

    expect(screen.getByText(CustomDashboardsI18nKey.WidgetUnavailable)).toBeTruthy();
    expect(screen.queryByText(SAVED_QUERY.name)).toBeNull();
  });

  test('keeps the widget title and description on the placeholder', () => {
    denied();
    renderCard({ widget: { ...WIDGET, title: 'Team spend', description: 'Per team' }, widgetQuery: UNAVAILABLE });

    expect(screen.getByText('Team spend')).toBeTruthy();
    expect(screen.getByText('Per team')).toBeTruthy();
  });

  test('shows the placeholder instead of a single value card', () => {
    denied();
    renderCard({ widget: { ...WIDGET, view: WidgetView.SingleValue }, widgetQuery: UNAVAILABLE });

    expect(screen.getByText(CustomDashboardsI18nKey.WidgetUnavailable)).toBeTruthy();
  });

  test('tells its dashboard whether it is unavailable', () => {
    const onDeniedChange = vi.fn();
    denied();
    renderCard({ widgetQuery: UNAVAILABLE, onDeniedChange });

    expect(onDeniedChange).toHaveBeenCalledWith('w-1', true);
  });

  test('offers no Open query for an inline widget', async () => {
    renderCard({
      widget: INLINE_WIDGET,
      widgetQuery: { ...COMPOSITE, savedQuery: INLINE_WIDGET.inline_query! },
      isEditing: true,
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Actions }));

    expect(await screen.findByRole('menuitem', { name: CustomDashboardsI18nKey.WidgetSettings })).toBeTruthy();
    expect(screen.queryByRole('menuitem', { name: CustomDashboardsI18nKey.OpenQuery })).toBeNull();
  });

  test('heads an untitled inline widget with its query name', () => {
    renderCard({ widget: INLINE_WIDGET, widgetQuery: { ...COMPOSITE, savedQuery: INLINE_WIDGET.inline_query! } });

    expect(screen.getByText('Inline spend')).toBeTruthy();
  });

  test('carries no own-range hint on a composite query whose data was refused', () => {
    denied();
    renderCard({ widgetQuery: COMPOSITE });

    expect(screen.getByText(CustomDashboardsI18nKey.WidgetUnavailable)).toBeTruthy();
    expect(screen.queryByRole('button', { name: CustomDashboardsI18nKey.CompositeSqlHint })).toBeNull();
  });

  test.each([
    ['an unreadable query', UNAVAILABLE],
    ['a readable query whose data was refused', STRUCTURED],
  ])('offers no widget menu in view mode for %s', (_, widgetQuery) => {
    denied();
    renderCard({ widgetQuery });

    expect(screen.getByText(CustomDashboardsI18nKey.WidgetUnavailable)).toBeTruthy();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Actions })).toBeNull();
  });

  test('keeps Remove but offers no Open query in edit mode for a query whose data was refused', async () => {
    denied();
    renderCard({ widgetQuery: STRUCTURED, isEditing: true });
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Actions }));

    expect(await screen.findByRole('menuitem', { name: CustomDashboardsI18nKey.RemoveWidget })).toBeTruthy();
    expect(screen.queryByRole('menuitem', { name: CustomDashboardsI18nKey.OpenQuery })).toBeNull();
  });

  describe('before the first answer', () => {
    const loading = () =>
      vi.mocked(useDashboardWidgetData).mockReturnValue({
        result: null,
        meta: null,
        isLoading: true,
        hasFailed: false,
        isDenied: false,
        previousResult: null,
        onRetry,
      });

    test('heads an untitled widget generically rather than with its saved query name', () => {
      loading();
      renderCard();

      expect(screen.getByRole('region', { name: CustomDashboardsI18nKey.SavedQuery })).toBeTruthy();
      expect(screen.queryByText(SAVED_QUERY.name)).toBeNull();
      expect(screen.queryByRole('button', { name: ButtonsI18nKey.Actions })).toBeNull();
    });

    test('heads an untitled single value widget generically', () => {
      loading();
      renderCard({ widget: { ...WIDGET, view: WidgetView.SingleValue } });

      expect(screen.getByText(CustomDashboardsI18nKey.SavedQuery)).toBeTruthy();
      expect(screen.queryByText(SAVED_QUERY.name)).toBeNull();
    });

    test('keeps a widget its own title', () => {
      loading();
      renderCard({ widget: { ...WIDGET, title: 'Weekly spend' } });

      expect(screen.getByRole('region', { name: 'Weekly spend' })).toBeTruthy();
    });
  });
});
