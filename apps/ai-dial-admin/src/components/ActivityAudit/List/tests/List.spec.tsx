import { act, fireEvent, render, screen } from '@testing-library/react';
import { ReactNode, useEffect } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  ColDef,
  GridOptions,
  GridReadyEvent,
  IDatasource,
  IGetRowsParams,
  ValueFormatterParams,
} from 'ag-grid-community';

let isReadOnlyAdminMock = false;
vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: () => isReadOnlyAdminMock,
}));

const featureFlagsMock = { deploymentsEnabled: true, analyticsEnabled: false };
vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({ featureFlags: featureFlagsMock }),
}));

const showNotificationMock = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification: showNotificationMock, removeNotification: vi.fn() }),
}));

vi.mock('@/src/hooks/use-time-filter', () => ({
  useTimeFilter: () => ({
    timePeriod: 'last_7_days',
    timeRange: { startDate: new Date(0), endDate: new Date(0) },
    isCustom: false,
    onTimePeriodChange: vi.fn(),
    onTimeRangeChange: vi.fn(),
  }),
}));

vi.mock('@/src/components/Common/TimeFilter/TimeFilter', () => ({
  __esModule: true,
  default: ({ onTimePeriodChange }: { onTimePeriodChange: (period: string) => void }) => (
    <button onClick={() => onTimePeriodChange('last_24_hours')}>change-period</button>
  ),
}));

vi.mock('@/src/components/ListView/Header/ResetFiltersButton', () => ({
  __esModule: true,
  default: () => <button>ResetFilters</button>,
}));

interface ListViewMockProps {
  children?: ReactNode;
  columnDefs?: ColDef[];
  additionalGridOptions?: GridOptions;
  storageKey?: string;
  onGridReady?: (event: GridReadyEvent) => void;
}

const gridApiMock = {
  setGridOption: vi.fn(),
  setFilterModel: vi.fn(),
};

const listViewPropsMock = vi.fn();
vi.mock('@/src/components/ListView/ListView', () => ({
  __esModule: true,
  default: (props: ListViewMockProps) => {
    listViewPropsMock(props);
    useEffect(() => {
      props.onGridReady?.({ api: gridApiMock } as unknown as GridReadyEvent);
      // The real grid reports readiness once; re-running it here would reset the datasource
      // captured by these tests.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <div>{props.children}</div>;
  },
}));

vi.mock('@/src/components/ActivityAudit/Modals/Details', () => ({
  __esModule: true,
  default: () => null,
}));

const emptyPage = { data: [], total: 0, totalPages: 0 };
const getActivitiesMock = vi.fn().mockResolvedValue(emptyPage);
const getDeploymentActivitiesMock = vi.fn().mockResolvedValue(emptyPage);
const getAnalyticsActivitiesMock = vi.fn().mockResolvedValue(emptyPage);
vi.mock('@/src/app/[lang]/activity-audit/actions', () => ({
  getActivities: (...args: unknown[]) => getActivitiesMock(...args),
  getDeploymentActivities: (...args: unknown[]) => getDeploymentActivitiesMock(...args),
  getAnalyticsActivities: (...args: unknown[]) => getAnalyticsActivitiesMock(...args),
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    DialConfirmationPopup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    DialGhostButton: ({ label }: { label: string }) => <button>{label}</button>,
    DialNeutralButton: ({ label }: { label: string }) => <button>{label}</button>,
    DialTooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
    DialSelect: ({
      options,
      value,
      onChange,
    }: {
      options: { value: string; label: string; disabled?: boolean }[];
      value: string;
      onChange: (v: string) => void;
    }) => (
      <select aria-label="View" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
    ),
  };
});

import ActivityAuditList from '@/src/components/ActivityAudit/List/List';
import { ACTIONS_COLUMN_CEL_ID, PAGE_SIZE } from '@/src/constants/ag-grid';
import {
  ActionMenuOperationI18nKey,
  ButtonsI18nKey,
  EntitiesI18nKey,
  RollbackI18nKey,
  TelemetryI18nKey,
} from '@/src/constants/i18n';
import { DialActivity } from '@/src/models/activity-audit';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { FilterDto } from '@/src/models/request';
import { ActivityAuditResourceType, ActivityAuditType, ActivityAuditView } from '@/src/types/activity-audit';
import { FilterOperatorDto } from '@/src/types/request';
import { AUDIT_LIST_PRESELECT_STORAGE_KEY } from '@/src/constants/audit-list-preselect';
import { AuditListPreselect } from '@/src/types/audit-list-preselect';

const RESOURCE_ID_FIELD = 'resourceId';
const RESOURCE_TYPE_FIELD = 'resourceType';

const lastListViewProps = (): ListViewMockProps =>
  listViewPropsMock.mock.calls[listViewPropsMock.mock.calls.length - 1][0] as ListViewMockProps;

const lastColumnDefs = (): ColDef[] => lastListViewProps().columnDefs ?? [];

const rowActionIds = (): string[] => {
  const actionColumn = lastColumnDefs().find((column) => column.field === ACTIONS_COLUMN_CEL_ID);
  const { items } = (actionColumn?.cellRendererParams ?? {}) as { items: { id: string }[] };
  return items.map((item) => item.id);
};

const lastDatasource = (): IDatasource => {
  const call = [...gridApiMock.setGridOption.mock.calls].reverse().find(([option]) => option === 'datasource');
  return call?.[1] as IDatasource;
};

const requestRows = async (startRow = 0, endRow = PAGE_SIZE) => {
  const successCallback = vi.fn();
  const failCallback = vi.fn();
  const params = {
    startRow,
    endRow,
    successCallback,
    failCallback,
    sortModel: [],
    filterModel: {},
    context: void 0,
  } as unknown as IGetRowsParams;

  await act(async () => {
    await lastDatasource().getRows(params);
  });

  return { successCallback, failCallback };
};

const activity = (overrides: Partial<DialActivity> = {}): DialActivity =>
  ({
    activityId: 'abc-123',
    activityType: ActivityAuditType.Update,
    resourceType: ActivityAuditResourceType.TABLE,
    resourceId: 'orders',
    epochTimestampMs: 1,
    ...overrides,
  }) as DialActivity;

const onePage = (data: DialActivity[]) => ({ data, total: data.length, totalPages: 1 });

const renderAnalyticsTab = () =>
  render(
    <ActivityAuditList
      entity={{ name: 'orders' } as BaseEntity}
      entityType={ActivityAuditResourceType.TABLE}
      viewMode={ActivityAuditView.Analytics}
    />,
  );

beforeEach(() => {
  // The preselect is read from session storage on mount in every test, not only in the
  // preselect block, so a value left behind by one test would reach the next one.
  sessionStorage.clear();
  isReadOnlyAdminMock = false;
  featureFlagsMock.analyticsEnabled = false;
  showNotificationMock.mockClear();
  listViewPropsMock.mockClear();
  gridApiMock.setGridOption.mockClear();
  gridApiMock.setFilterModel.mockClear();
  getActivitiesMock.mockClear().mockResolvedValue(emptyPage);
  getDeploymentActivitiesMock.mockClear().mockResolvedValue(emptyPage);
  getAnalyticsActivitiesMock.mockClear().mockResolvedValue(emptyPage);
});

describe('ActivityAuditList :: view-aware behavior', () => {
  test('renders Rollback button by default (Config view)', () => {
    render(<ActivityAuditList />);
    expect(screen.getByText(RollbackI18nKey.Rollback)).toBeInTheDocument();
  });

  test('hides Rollback button after switching to Deployments view', () => {
    render(<ActivityAuditList />);
    act(() => {
      fireEvent.change(screen.getByLabelText('View'), { target: { value: 'Deployments' } });
    });
    expect(screen.queryByText(RollbackI18nKey.Rollback)).not.toBeInTheDocument();
  });

  test('restores Rollback button when switching back to Config view', () => {
    render(<ActivityAuditList />);
    act(() => {
      fireEvent.change(screen.getByLabelText('View'), { target: { value: 'Deployments' } });
    });
    act(() => {
      fireEvent.change(screen.getByLabelText('View'), { target: { value: 'Config' } });
    });
    expect(screen.getByText(RollbackI18nKey.Rollback)).toBeInTheDocument();
  });

  test('renders the Deployments view option and Refresh control', () => {
    render(<ActivityAuditList />);
    const options = Array.from(screen.getByLabelText('View').querySelectorAll('option'));
    const values = options.map((o) => (o as HTMLOptionElement).value);
    expect(values).toEqual(['Config', 'Deployments']);
    expect(screen.getByText(ButtonsI18nKey.Refresh)).toBeInTheDocument();
    expect(screen.getByText(TelemetryI18nKey.ActivityViewDeployments)).toBeInTheDocument();
  });

  test('hides the View dropdown when viewMode is provided', () => {
    render(<ActivityAuditList viewMode={ActivityAuditView.Deployments} />);
    expect(screen.queryByLabelText('View')).not.toBeInTheDocument();
  });

  test('hides the Rollback button when viewMode forces Deployments', () => {
    render(<ActivityAuditList viewMode={ActivityAuditView.Deployments} />);
    expect(screen.queryByText(RollbackI18nKey.Rollback)).not.toBeInTheDocument();
  });

  test('still renders the Rollback button when viewMode forces Config', () => {
    render(<ActivityAuditList viewMode={ActivityAuditView.Config} />);
    expect(screen.getByText(RollbackI18nKey.Rollback)).toBeInTheDocument();
  });
});

describe('ActivityAuditList :: audit-list-preselect', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test('without preselect, default view is Config', () => {
    render(<ActivityAuditList />);
    expect((screen.getByLabelText('View') as HTMLSelectElement).value).toBe('Config');
  });

  test('with preselect "global-firewall", initial view is Deployments', () => {
    sessionStorage.setItem(AUDIT_LIST_PRESELECT_STORAGE_KEY, AuditListPreselect.GlobalFirewall);
    render(<ActivityAuditList />);
    expect((screen.getByLabelText('View') as HTMLSelectElement).value).toBe('Deployments');
  });

  test('preselect is ignored when an entity is provided', () => {
    sessionStorage.setItem(AUDIT_LIST_PRESELECT_STORAGE_KEY, AuditListPreselect.GlobalFirewall);
    render(<ActivityAuditList entity={{ name: 'm' } as never} entityType="Model" />);
    expect(sessionStorage.getItem(AUDIT_LIST_PRESELECT_STORAGE_KEY)).toBe(AuditListPreselect.GlobalFirewall);
  });

  test('unknown preselect value is ignored without corrupting state (and not cleared)', () => {
    sessionStorage.setItem(AUDIT_LIST_PRESELECT_STORAGE_KEY, 'something-else');
    render(<ActivityAuditList />);
    expect((screen.getByLabelText('View') as HTMLSelectElement).value).toBe('Config');
    expect(sessionStorage.getItem(AUDIT_LIST_PRESELECT_STORAGE_KEY)).toBe('something-else');
  });
});

describe('ActivityAuditList :: Analytics view option', () => {
  const viewOptions = () => Array.from(screen.getByLabelText('View').querySelectorAll('option')) as HTMLOptionElement[];

  test('omits the Analytics option and issues no analytics request when the feature is disabled', async () => {
    render(<ActivityAuditList />);
    await requestRows();

    expect(viewOptions().map((option) => option.value)).toEqual([
      ActivityAuditView.Config,
      ActivityAuditView.Deployments,
    ]);
    expect(getAnalyticsActivitiesMock).not.toHaveBeenCalled();
  });

  test('lists Config, Deployments and Analytics when the analytics feature is enabled', () => {
    featureFlagsMock.analyticsEnabled = true;
    render(<ActivityAuditList />);

    expect(viewOptions().map((option) => option.value)).toEqual([
      ActivityAuditView.Config,
      ActivityAuditView.Deployments,
      ActivityAuditView.Analytics,
    ]);
    expect(screen.getByText(TelemetryI18nKey.ActivityViewAnalytics)).toBeInTheDocument();
    expect((screen.getByLabelText('View') as HTMLSelectElement).value).toBe(ActivityAuditView.Config);
  });

  test('offers every view option as selectable to a read-only admin', () => {
    isReadOnlyAdminMock = true;
    featureFlagsMock.analyticsEnabled = true;
    render(<ActivityAuditList />);

    expect(viewOptions().every((option) => !option.disabled)).toBe(true);
  });
});

describe('ActivityAuditList :: per-view fetcher', () => {
  test('invokes getActivities on the default Config view', async () => {
    render(<ActivityAuditList />);
    await requestRows();

    expect(getActivitiesMock).toHaveBeenCalled();
    expect(getDeploymentActivitiesMock).not.toHaveBeenCalled();
    expect(getAnalyticsActivitiesMock).not.toHaveBeenCalled();
  });

  test('invokes getDeploymentActivities when viewMode forces the Deployments view', async () => {
    render(<ActivityAuditList viewMode={ActivityAuditView.Deployments} />);
    await requestRows();

    expect(getDeploymentActivitiesMock).toHaveBeenCalled();
    expect(getActivitiesMock).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('View')).toBeNull();
  });

  test('invokes getAnalyticsActivities when viewMode forces the Analytics view', async () => {
    render(<ActivityAuditList viewMode={ActivityAuditView.Analytics} />);
    await requestRows();

    expect(getAnalyticsActivitiesMock).toHaveBeenCalledWith(PAGE_SIZE, 0, [], expect.any(Array));
    expect(getActivitiesMock).not.toHaveBeenCalled();
    expect(getDeploymentActivitiesMock).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('View')).toBeNull();
  });

  test('switches to the analytics fetcher when the user selects the Analytics option', async () => {
    featureFlagsMock.analyticsEnabled = true;
    render(<ActivityAuditList />);
    act(() => {
      fireEvent.change(screen.getByLabelText('View'), { target: { value: ActivityAuditView.Analytics } });
    });
    await requestRows();

    expect(getAnalyticsActivitiesMock).toHaveBeenCalled();
  });
});

describe('ActivityAuditList :: Analytics view rows', () => {
  test('renders a row for every resource type the analytics feed returns', async () => {
    getAnalyticsActivitiesMock.mockResolvedValue(
      onePage([
        activity({ activityId: 't', resourceType: ActivityAuditResourceType.TABLE }),
        activity({ activityId: 'c', resourceType: ActivityAuditResourceType.TABLE_COLUMN }),
        activity({ activityId: 'p', resourceType: ActivityAuditResourceType.PIPELINE }),
        activity({ activityId: 'q', resourceType: ActivityAuditResourceType.SAVED_QUERY }),
      ]),
    );
    render(<ActivityAuditList viewMode={ActivityAuditView.Analytics} />);
    const { successCallback } = await requestRows();

    const [rows] = successCallback.mock.calls[0] as [DialActivity[]];
    expect(rows.map((row) => row.resourceType)).toEqual([
      ActivityAuditResourceType.TABLE,
      ActivityAuditResourceType.TABLE_COLUMN,
      ActivityAuditResourceType.PIPELINE,
      ActivityAuditResourceType.SAVED_QUERY,
    ]);
  });

  test('labels a pipeline and a saved-query row through the analytics Resource type column', async () => {
    getAnalyticsActivitiesMock.mockResolvedValue(
      onePage([
        activity({ activityId: 'p', resourceType: ActivityAuditResourceType.PIPELINE, resourceId: 'daily_rollup' }),
        activity({ activityId: 'q', resourceType: ActivityAuditResourceType.SAVED_QUERY, resourceId: 'q1' }),
      ]),
    );
    render(<ActivityAuditList viewMode={ActivityAuditView.Analytics} />);
    const { successCallback } = await requestRows();

    const [rows] = successCallback.mock.calls[0] as [DialActivity[]];
    const resourceType = lastColumnDefs().find((column) => column.field === RESOURCE_TYPE_FIELD);
    const formatResourceType = resourceType?.valueFormatter as (params: ValueFormatterParams) => string;

    // The two halves this joins: the rows reach the grid, and the analytics column set is what
    // formats them. The local analytics feed carries neither type, so nothing else can prove it.
    expect(rows.map((row) => formatResourceType({ value: row.resourceType } as ValueFormatterParams))).toEqual([
      EntitiesI18nKey.AnalyticsPipeline,
      EntitiesI18nKey.AnalyticsSavedQuery,
    ]);
  });

  test('renders analytics rows flat, keeping the parent activity identifier', async () => {
    getAnalyticsActivitiesMock.mockResolvedValue(
      onePage([
        activity({ activityId: 'parent-1', resourceType: ActivityAuditResourceType.TABLE }),
        activity({
          activityId: 'child-1',
          resourceType: ActivityAuditResourceType.TABLE_COLUMN,
          parentActivityId: 'parent-1',
        }),
      ]),
    );
    render(<ActivityAuditList viewMode={ActivityAuditView.Analytics} />);
    const { successCallback } = await requestRows();

    const [rows] = successCallback.mock.calls[0] as [(DialActivity & { children?: DialActivity[] })[]];
    expect(rows.map((row) => row.activityId)).toEqual(['parent-1', 'child-1']);
    expect(rows.every((row) => row.children === undefined)).toBe(true);
    expect(rows[1].parentActivityId).toBe('parent-1');
    // A single page of the feed is asked for exactly once — no child lookup is issued.
    expect(getAnalyticsActivitiesMock).toHaveBeenCalledOnce();
  });

  test('renders neither the expander column nor the Version column', () => {
    render(<ActivityAuditList viewMode={ActivityAuditView.Analytics} />);

    const fields = lastColumnDefs().map((column) => column.field);
    expect(fields).not.toContain('expanderColumn');
    expect(fields).not.toContain('version');
    expect(fields).toContain(RESOURCE_ID_FIELD);
  });

  test('persists analytics column state under its own storage key', () => {
    featureFlagsMock.analyticsEnabled = true;
    render(<ActivityAuditList />);
    expect(lastListViewProps().storageKey).toBe('/activity-audit:config');

    act(() => {
      fireEvent.change(screen.getByLabelText('View'), { target: { value: ActivityAuditView.Analytics } });
    });
    expect(lastListViewProps().storageKey).toBe('/activity-audit:analytics');
  });

  test('renders no page-level Rollback button on the Analytics view', () => {
    featureFlagsMock.analyticsEnabled = true;
    render(<ActivityAuditList />);
    act(() => {
      fireEvent.change(screen.getByLabelText('View'), { target: { value: ActivityAuditView.Analytics } });
    });

    expect(screen.queryByText(RollbackI18nKey.Rollback)).toBeNull();
  });

  test('offers no Rollback row action on the Analytics view', () => {
    render(<ActivityAuditList viewMode={ActivityAuditView.Analytics} />);

    expect(rowActionIds()).toEqual([ActionMenuOperationI18nKey.Open_in_new_tab]);
  });

  test('opens the global detail page in a new tab on a row body click', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<ActivityAuditList viewMode={ActivityAuditView.Analytics} />);

    const setSelected = vi.fn();
    lastListViewProps().additionalGridOptions?.onCellClicked?.({
      data: activity(),
      colDef: { field: 'activityId' },
      node: { setSelected },
    } as never);

    expect(setSelected).toHaveBeenCalled();
    expect(openSpy).toHaveBeenCalledWith('/activity-audit/abc-123', '_blank');
    openSpy.mockRestore();
  });

  test('opens the global detail page in a new tab from the row action', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<ActivityAuditList viewMode={ActivityAuditView.Analytics} />);

    const actionColumn = lastColumnDefs().find((column) => column.field === ACTIONS_COLUMN_CEL_ID);
    const { items } = (actionColumn?.cellRendererParams ?? {}) as {
      items: { id: string; onClick: (row?: DialActivity) => void }[];
    };
    items[0].onClick(activity());

    expect(openSpy).toHaveBeenCalledWith('/activity-audit/abc-123', '_blank');
    openSpy.mockRestore();
  });
});

describe('ActivityAuditList :: Analytics deleted-table child suppression', () => {
  const ACTIVITY_ID_FIELD = 'activityId';

  const tableDelete = (activityId: string, resourceId: string) =>
    activity({
      activityId,
      resourceId,
      resourceType: ActivityAuditResourceType.TABLE,
      activityType: ActivityAuditType.Delete,
    });

  const columnDelete = (activityId: string, resourceId: string, parentActivityId: string) =>
    activity({
      activityId,
      resourceId,
      parentActivityId,
      resourceType: ActivityAuditResourceType.TABLE_COLUMN,
      activityType: ActivityAuditType.Delete,
    });

  const parentLookupCalls = (fetchMock: typeof getAnalyticsActivitiesMock) =>
    fetchMock.mock.calls.filter((call) =>
      ((call[3] ?? []) as FilterDto[]).some((filter) => filter.column === ACTIVITY_ID_FIELD),
    );

  const listedIds = (successCallback: ReturnType<typeof vi.fn>) =>
    (successCallback.mock.calls[0][0] as DialActivity[]).map((row) => row.activityId);

  // The feed and the parent lookup are the same server action, so the mock answers by what a
  // call asks for rather than by call order: a lookup the component never issues then leaves no
  // queued answer behind to reach the next test.
  const mockFeedAndLookup = (feed: DialActivity[], onLookup: () => Promise<unknown>) =>
    getAnalyticsActivitiesMock.mockImplementation((...args: unknown[]) =>
      ((args[3] ?? []) as FilterDto[]).some((filter) => filter.column === ACTIVITY_ID_FIELD)
        ? onLookup()
        : Promise.resolve(onePage(feed)),
    );

  test('lists a table Delete without any of the column activities it recorded', async () => {
    getAnalyticsActivitiesMock.mockResolvedValue(
      onePage([
        tableDelete('parent-delete', 'chat_ratings'),
        columnDelete('col-1', 'chat_ratings:id', 'parent-delete'),
        columnDelete('col-2', 'chat_ratings:rating', 'parent-delete'),
        columnDelete('col-3', 'chat_ratings:chat_id', 'parent-delete'),
      ]),
    );
    render(<ActivityAuditList viewMode={ActivityAuditView.Analytics} />);
    const { successCallback } = await requestRows();

    expect(listedIds(successCallback)).toEqual(['parent-delete']);
    // The parent arrived in the same page, so it costs no request to resolve.
    expect(parentLookupCalls(getAnalyticsActivitiesMock)).toHaveLength(0);
  });

  test('lists a column dropped from a living table with its parent identifier intact', async () => {
    getAnalyticsActivitiesMock.mockResolvedValue(
      onePage([
        activity({
          activityId: 'parent-update',
          resourceId: 'test_new_flow',
          resourceType: ActivityAuditResourceType.TABLE,
          activityType: ActivityAuditType.Update,
        }),
        columnDelete('dropped-column', 'test_new_flow:gate_probe_col', 'parent-update'),
      ]),
    );
    render(<ActivityAuditList viewMode={ActivityAuditView.Analytics} />);
    const { successCallback } = await requestRows();

    const [rows] = successCallback.mock.calls[0] as [DialActivity[]];
    expect(rows.map((row) => row.activityId)).toEqual(['parent-update', 'dropped-column']);
    expect(rows[1].parentActivityId).toBe('parent-update');
  });

  test('issues no resolution request for a page whose rows name no parent', async () => {
    getAnalyticsActivitiesMock.mockResolvedValue(
      onePage([tableDelete('t1', 'orders'), activity({ activityId: 't2', resourceId: 'daily_rollup' })]),
    );
    render(<ActivityAuditList viewMode={ActivityAuditView.Analytics} />);
    const { successCallback } = await requestRows();

    expect(getAnalyticsActivitiesMock).toHaveBeenCalledOnce();
    expect(listedIds(successCallback)).toEqual(['t1', 't2']);
  });

  test('resolves a parent absent from the page in one unfiltered lookup and suppresses its children', async () => {
    mockFeedAndLookup(
      [
        columnDelete('col-1', 'chat_ratings:id', 'parent-delete'),
        columnDelete('col-2', 'chat_ratings:rating', 'parent-delete'),
      ],
      () => Promise.resolve(onePage([tableDelete('parent-delete', 'chat_ratings')])),
    );
    render(<ActivityAuditList viewMode={ActivityAuditView.Analytics} />);
    const { successCallback } = await requestRows();

    // One request for the whole page, carrying the parent identifiers and nothing else: a
    // resource-type or time filter here would hide the very parent being resolved.
    expect(getAnalyticsActivitiesMock).toHaveBeenNthCalledWith(
      2,
      PAGE_SIZE,
      0,
      [],
      [{ column: ACTIVITY_ID_FIELD, value: 'parent-delete', operator: FilterOperatorDto.INCLUDES }],
    );
    expect(parentLookupCalls(getAnalyticsActivitiesMock)).toHaveLength(1);
    expect(listedIds(successCallback)).toEqual([]);
  });

  test('lists a child whose parent the resolution does not answer for', async () => {
    mockFeedAndLookup([columnDelete('orphan', 'orders:total', 'never-answered')], () => Promise.resolve(onePage([])));
    render(<ActivityAuditList viewMode={ActivityAuditView.Analytics} />);
    const { successCallback, failCallback } = await requestRows();

    expect(parentLookupCalls(getAnalyticsActivitiesMock)).toHaveLength(1);
    expect(listedIds(successCallback)).toEqual(['orphan']);
    expect(failCallback).not.toHaveBeenCalled();
  });

  test('lists the page and raises nothing when the parent lookup itself fails', async () => {
    mockFeedAndLookup([columnDelete('col-1', 'chat_ratings:id', 'parent-delete')], () =>
      Promise.reject(new Error('lookup unavailable')),
    );
    render(<ActivityAuditList viewMode={ActivityAuditView.Analytics} />);
    const { successCallback, failCallback } = await requestRows();

    expect(parentLookupCalls(getAnalyticsActivitiesMock)).toHaveLength(1);
    expect(listedIds(successCallback)).toEqual(['col-1']);
    expect(failCallback).not.toHaveBeenCalled();
    expect(showNotificationMock).not.toHaveBeenCalled();
  });

  test('resolves no parent and suppresses no row on the Config view', async () => {
    const parent = tableDelete('parent-delete', 'chat_ratings');
    const child = columnDelete('col-1', 'chat_ratings:id', 'parent-delete');
    getActivitiesMock.mockResolvedValueOnce(onePage([parent, child])).mockResolvedValueOnce(onePage([child]));

    render(<ActivityAuditList />);
    const { successCallback } = await requestRows();

    expect(listedIds(successCallback)).toEqual(['parent-delete', 'col-1']);
    expect(parentLookupCalls(getActivitiesMock)).toHaveLength(0);
  });

  test('resolves no parent and suppresses no row on the Deployments view', async () => {
    getDeploymentActivitiesMock.mockResolvedValue(
      onePage([
        tableDelete('parent-delete', 'chat_ratings'),
        columnDelete('col-1', 'chat_ratings:id', 'parent-delete'),
      ]),
    );

    render(<ActivityAuditList viewMode={ActivityAuditView.Deployments} />);
    const { successCallback } = await requestRows();

    expect(listedIds(successCallback)).toEqual(['parent-delete', 'col-1']);
    expect(getDeploymentActivitiesMock).toHaveBeenCalledOnce();
    expect(parentLookupCalls(getDeploymentActivitiesMock)).toHaveLength(0);
  });
});

describe('ActivityAuditList :: Analytics entity audit tab', () => {
  test('requests the analytics feed with the resource-type in and resource-id co filter pair', async () => {
    renderAnalyticsTab();
    await requestRows();

    expect(getAnalyticsActivitiesMock).toHaveBeenCalledWith(
      PAGE_SIZE,
      0,
      [],
      expect.arrayContaining([
        { column: RESOURCE_TYPE_FIELD, value: 'Table,TableColumn', operator: FilterOperatorDto.INCLUDES },
        { column: RESOURCE_ID_FIELD, value: 'orders', operator: FilterOperatorDto.CONTAINS },
      ]),
    );
  });

  test('excludes an activity that belongs to a similarly named table', async () => {
    getAnalyticsActivitiesMock.mockResolvedValue(
      onePage([
        activity({ activityId: 'own-table', resourceId: 'orders' }),
        activity({
          activityId: 'own-column',
          resourceId: 'orders:total',
          resourceType: ActivityAuditResourceType.TABLE_COLUMN,
        }),
        activity({
          activityId: 'other-column',
          resourceId: 'my_orders:total',
          resourceType: ActivityAuditResourceType.TABLE_COLUMN,
        }),
      ]),
    );
    renderAnalyticsTab();
    const { successCallback } = await requestRows();

    const [rows] = successCallback.mock.calls[0] as [DialActivity[]];
    expect(rows.map((row) => row.resourceId)).toEqual(['orders', 'orders:total']);
  });

  test('keeps the Resource type and Resource identifier columns so a column activity names its column', () => {
    renderAnalyticsTab();

    const columns = lastColumnDefs();
    const resourceType = columns.find((column) => column.field === RESOURCE_TYPE_FIELD);
    const resourceId = columns.find((column) => column.field === RESOURCE_ID_FIELD);

    const formatResourceType = resourceType?.valueFormatter as (params: ValueFormatterParams) => string;

    expect(resourceId?.headerName).toBe('Resource identifier');
    expect(formatResourceType({ value: ActivityAuditResourceType.TABLE_COLUMN } as ValueFormatterParams)).toBe(
      EntitiesI18nKey.AnalyticsTableColumn,
    );
  });

  test('offers no Rollback row action', () => {
    renderAnalyticsTab();

    expect(rowActionIds()).toEqual([ActionMenuOperationI18nKey.Open_in_new_tab]);
    expect(rowActionIds()).not.toContain(ActionMenuOperationI18nKey.Resource_rollback);
  });

  test('opens the global detail page in a new tab on a row click rather than an entity-namespaced route', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    renderAnalyticsTab();

    lastListViewProps().additionalGridOptions?.onCellClicked?.({
      data: activity(),
      colDef: { field: 'activityId' },
      node: { setSelected: vi.fn() },
    } as never);

    expect(openSpy).toHaveBeenCalledWith('/activity-audit/abc-123', '_blank');
    expect(openSpy).not.toHaveBeenCalledWith(expect.stringContaining('/tables/'), expect.anything());
    openSpy.mockRestore();
  });

  test('reports an empty grid without a notification when the table has no recorded history', async () => {
    renderAnalyticsTab();
    const { successCallback, failCallback } = await requestRows();

    expect(successCallback).toHaveBeenCalledWith([], 0);
    expect(failCallback).not.toHaveBeenCalled();
    expect(showNotificationMock).not.toHaveBeenCalled();
  });

  test('leaves the grid in its failure state without a notification when the feed request fails', async () => {
    getAnalyticsActivitiesMock.mockRejectedValue(new Error('feed unavailable'));
    renderAnalyticsTab();
    const { successCallback, failCallback } = await requestRows();

    expect(failCallback).toHaveBeenCalled();
    expect(successCallback).not.toHaveBeenCalled();
    expect(showNotificationMock).not.toHaveBeenCalled();
  });

  test('re-requests the list with the time-range filters when the time period changes', async () => {
    renderAnalyticsTab();
    getAnalyticsActivitiesMock.mockClear();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'change-period' }));
    });
    await requestRows();

    expect(getAnalyticsActivitiesMock).toHaveBeenCalledWith(
      PAGE_SIZE,
      0,
      [],
      expect.arrayContaining([
        expect.objectContaining({
          column: 'epochTimestampMs',
          operator: FilterOperatorDto.GREATER_THAN_OR_EQUAL,
        }),
        expect.objectContaining({ column: 'epochTimestampMs', operator: FilterOperatorDto.LESS_THAN_OR_EQUAL }),
      ]),
    );
  });
});

describe('ActivityAuditList :: Analytics pipeline audit tab', () => {
  const PIPELINE_NAME = 'daily_rollup';

  const renderPipelineTab = () =>
    render(
      <ActivityAuditList
        entity={{ name: PIPELINE_NAME } as BaseEntity}
        entityType={ActivityAuditResourceType.PIPELINE}
        viewMode={ActivityAuditView.Analytics}
      />,
    );

  const pipelineActivity = (overrides: Partial<DialActivity> = {}) =>
    activity({ resourceType: ActivityAuditResourceType.PIPELINE, resourceId: PIPELINE_NAME, ...overrides });

  const lastFeedFilters = (): FilterDto[] =>
    (getAnalyticsActivitiesMock.mock.calls[getAnalyticsActivitiesMock.mock.calls.length - 1][3] ?? []) as FilterDto[];

  test('requests the analytics feed with the exact resource-type and resource-id pair', async () => {
    renderPipelineTab();
    await requestRows();

    expect(getAnalyticsActivitiesMock).toHaveBeenCalledWith(
      PAGE_SIZE,
      0,
      [],
      expect.arrayContaining([
        {
          column: RESOURCE_ID_FIELD,
          value: PIPELINE_NAME,
          operator: FilterOperatorDto.EQUALS,
        },
        {
          column: RESOURCE_TYPE_FIELD,
          value: ActivityAuditResourceType.PIPELINE,
          operator: FilterOperatorDto.EQUALS,
        },
      ]),
    );
  });

  test('sends neither a substring nor a resource-type inclusion filter', async () => {
    renderPipelineTab();
    await requestRows();

    const operators = lastFeedFilters().map((filter) => filter.operator);
    expect(operators).not.toContain(FilterOperatorDto.CONTAINS);
    expect(operators).not.toContain(FilterOperatorDto.INCLUDES);
  });

  test('lists every activity the feed answers with, dropping none client-side', async () => {
    getAnalyticsActivitiesMock.mockResolvedValue(
      onePage([
        pipelineActivity({ activityId: 'created', activityType: ActivityAuditType.Create }),
        pipelineActivity({ activityId: 'updated', activityType: ActivityAuditType.Update }),
        pipelineActivity({ activityId: 'deleted', activityType: ActivityAuditType.Delete }),
      ]),
    );
    renderPipelineTab();
    const { successCallback } = await requestRows();

    const [rows] = successCallback.mock.calls[0] as [DialActivity[]];
    expect(rows.map((row) => row.activityId)).toEqual(['created', 'updated', 'deleted']);
  });

  test('renders the single-entity column set, with neither resource column nor Version nor an expander', () => {
    renderPipelineTab();

    const fields = lastColumnDefs().map((column) => column.field);
    expect(fields).not.toContain(RESOURCE_TYPE_FIELD);
    expect(fields).not.toContain(RESOURCE_ID_FIELD);
    expect(fields).not.toContain('version');
    expect(fields).not.toContain('expanderColumn');
    expect(fields).toContain('activityType');
    expect(fields).toContain('epochTimestampMs');
    expect(fields).toContain('initiatedEmail');
    expect(fields).toContain('activityId');
    expect(fields).toContain('parentActivityId');
  });

  test('lists a bulk-bumped update with the parent identifier the backend supplied', async () => {
    const tableUpdate = activity({
      activityId: 'table-update',
      resourceId: 'orders',
      resourceType: ActivityAuditResourceType.TABLE,
      activityType: ActivityAuditType.Update,
    });
    getAnalyticsActivitiesMock.mockImplementation((...args: unknown[]) =>
      ((args[3] ?? []) as FilterDto[]).some((filter) => filter.column === 'activityId')
        ? Promise.resolve(onePage([tableUpdate]))
        : Promise.resolve(onePage([pipelineActivity({ activityId: 'bumped', parentActivityId: 'table-update' })])),
    );
    renderPipelineTab();
    const { successCallback } = await requestRows();

    const [rows] = successCallback.mock.calls[0] as [DialActivity[]];
    expect(rows.map((row) => row.activityId)).toEqual(['bumped']);
    expect(rows[0].parentActivityId).toBe('table-update');
  });

  test('lists a Delete recorded by the target table deletion, which carries no parent', async () => {
    getAnalyticsActivitiesMock.mockResolvedValue(
      onePage([pipelineActivity({ activityId: 'target-dropped', activityType: ActivityAuditType.Delete })]),
    );
    renderPipelineTab();
    const { successCallback } = await requestRows();

    const [rows] = successCallback.mock.calls[0] as [DialActivity[]];
    expect(rows.map((row) => row.activityId)).toEqual(['target-dropped']);
    expect(rows[0].parentActivityId).toBeUndefined();
  });

  test('offers Open in a new tab and no Rollback row action', () => {
    renderPipelineTab();

    expect(rowActionIds()).toEqual([ActionMenuOperationI18nKey.Open_in_new_tab]);
    expect(rowActionIds()).not.toContain(ActionMenuOperationI18nKey.Resource_rollback);
  });

  test('opens the global audit detail page in a new tab on a row body click', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    renderPipelineTab();

    lastListViewProps().additionalGridOptions?.onCellClicked?.({
      data: pipelineActivity(),
      colDef: { field: 'activityId' },
      node: { setSelected: vi.fn() },
    } as never);

    expect(openSpy).toHaveBeenCalledWith('/activity-audit/abc-123', '_blank');
    expect(openSpy).not.toHaveBeenCalledWith(expect.stringContaining('/pipelines/'), expect.anything());
    openSpy.mockRestore();
  });

  test('reports an empty grid without a notification for a pipeline with no recorded history', async () => {
    renderPipelineTab();
    const { successCallback, failCallback } = await requestRows();

    expect(successCallback).toHaveBeenCalledWith([], 0);
    expect(failCallback).not.toHaveBeenCalled();
    expect(showNotificationMock).not.toHaveBeenCalled();
  });

  test('re-requests the list with the time-range filters when the time period changes', async () => {
    renderPipelineTab();
    getAnalyticsActivitiesMock.mockClear();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'change-period' }));
    });
    await requestRows();

    expect(getAnalyticsActivitiesMock).toHaveBeenCalledWith(
      PAGE_SIZE,
      0,
      [],
      expect.arrayContaining([
        expect.objectContaining({
          column: 'epochTimestampMs',
          operator: FilterOperatorDto.GREATER_THAN_OR_EQUAL,
        }),
        expect.objectContaining({ column: 'epochTimestampMs', operator: FilterOperatorDto.LESS_THAN_OR_EQUAL }),
      ]),
    );
  });
});

describe('ActivityAuditList :: Config view parent/child aggregation', () => {
  test('aggregates child activities under their parent and fetches them by parent identifier', async () => {
    const parent = activity({
      activityId: 'parent-1',
      resourceType: ActivityAuditResourceType.MODEL,
      resourceId: 'gpt-4',
    });
    const child = activity({
      activityId: 'child-1',
      resourceType: ActivityAuditResourceType.MODEL,
      resourceId: 'gpt-4',
      parentActivityId: 'parent-1',
    });
    getActivitiesMock.mockResolvedValueOnce(onePage([parent])).mockResolvedValueOnce(onePage([child]));

    render(<ActivityAuditList />);
    const { successCallback } = await requestRows();

    expect(getActivitiesMock).toHaveBeenNthCalledWith(
      2,
      PAGE_SIZE,
      0,
      [],
      [{ column: 'parentActivityId', value: 'parent-1', operator: FilterOperatorDto.INCLUDES }],
    );

    const [rows] = successCallback.mock.calls[0] as [(DialActivity & { children?: DialActivity[] })[]];
    expect(rows.map((row) => row.activityId)).toEqual(['parent-1', 'child-1']);
    expect(rows[0].children?.map((row) => row.activityId)).toEqual(['child-1']);
  });
});

describe('ActivityAuditList :: Config entity audit tab', () => {
  const renderConfigTab = () =>
    render(<ActivityAuditList entity={{ name: 'gpt-4' } as BaseEntity} entityType={ActivityAuditResourceType.MODEL} />);

  test('keeps its Rollback row action', () => {
    renderConfigTab();

    expect(rowActionIds()).toEqual([
      ActionMenuOperationI18nKey.Open_in_new_tab,
      ActionMenuOperationI18nKey.Resource_rollback,
    ]);
  });

  test('keeps the single-entity column set', () => {
    renderConfigTab();

    const fields = lastColumnDefs().map((column) => column.field);
    expect(fields).not.toContain(RESOURCE_TYPE_FIELD);
    expect(fields).not.toContain(RESOURCE_ID_FIELD);
    expect(fields).toContain('activityType');
  });

  test('requests the admin feed with the exact resource-id and resource-type pair', async () => {
    renderConfigTab();
    await requestRows();

    expect(getActivitiesMock).toHaveBeenCalledWith(
      PAGE_SIZE,
      0,
      [],
      expect.arrayContaining([
        { column: RESOURCE_ID_FIELD, value: 'gpt-4', operator: FilterOperatorDto.EQUALS },
        {
          column: RESOURCE_TYPE_FIELD,
          value: ActivityAuditResourceType.MODEL,
          operator: FilterOperatorDto.EQUALS,
        },
      ]),
    );
    expect(getAnalyticsActivitiesMock).not.toHaveBeenCalled();
  });
});
