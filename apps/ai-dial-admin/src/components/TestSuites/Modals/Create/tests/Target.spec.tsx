import { SetStateAction } from 'react';

import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { CREATE_RESPONSE_METHOD } from '@/src/components/TestSuites/constants/responses-method';
import { Deployment, RouteTarget } from '@/src/models/evaluation/deployment';
import { SuiteType, TestSuite } from '@/src/models/evaluation/test-suite';
import { EntitiesI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import Target from '../Target';

const deployment: Deployment = {
  $type: 'dial-application',
  deploymentId: 'new-target',
  displayName: 'New target',
};
const getDeploymentsMock = vi.fn();
const getRoutesMock = vi.fn();
const routeTarget: RouteTarget = { name: 'search-route' };
let gridTarget: Deployment | RouteTarget = deployment;

const applySuiteUpdate = (update: SetStateAction<TestSuite>, previous: TestSuite): TestSuite =>
  typeof update === 'function' ? update(previous) : update;

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getDeployments: (...args: unknown[]) => getDeploymentsMock(...args),
  getRoutes: (...args: unknown[]) => getRoutesMock(...args),
}));

vi.mock('@/src/components/Grid/GridView/RadioSelectGrid', () => ({
  default: ({
    isLoading,
    data,
    columnDefs,
    idField,
    emptyTitle,
    onSelect,
  }: {
    isLoading: boolean;
    data: Array<Deployment | RouteTarget> | null;
    columnDefs: Array<{ field?: string }>;
    idField: string;
    emptyTitle: string;
    onSelect: (selected: Deployment | RouteTarget) => void;
  }) => {
    if (isLoading) return <div role="status">loading</div>;
    if (!data?.length) return <div>{emptyTitle}</div>;

    return (
      <div>
        <span>columns:{columnDefs.map(({ field }) => field).join(',')}</span>
        <span>id-field:{idField}</span>
        <button type="button" onClick={() => onSelect(gridTarget)}>
          Select target
        </button>
      </div>
    );
  },
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    Tabs: ({
      tabs,
      activeTabId,
      onTabChange,
    }: {
      tabs: Array<{ id: string; label: string }>;
      activeTabId: string;
      onTabChange: (id: string) => void;
    }) => (
      <div role="tablist">
        {tabs.map(({ id, label }) => (
          <button key={id} role="tab" aria-selected={activeTabId === id} onClick={() => onTabChange(id)}>
            {label}
          </button>
        ))}
      </div>
    ),
  };
});

describe('Target', () => {
  beforeEach(() => {
    getDeploymentsMock.mockReset();
    getDeploymentsMock.mockResolvedValue({ response: [deployment] });
    getRoutesMock.mockReset();
    getRoutesMock.mockResolvedValue([routeTarget]);
    gridTarget = deployment;
  });

  test('updates the target and reseeds its request model in one state update', async () => {
    const user = userEvent.setup();
    const onChangeTarget = vi.fn();
    let suiteUpdate: SetStateAction<TestSuite> | undefined;
    const onChange = vi.fn((update: SetStateAction<TestSuite>) => {
      suiteUpdate = update;
    });
    const suite = {
      endpointRef: CREATE_RESPONSE_METHOD,
      requestTemplate: { body: { content: { model: 'old-target', input: 'hello' } } },
    } as TestSuite;

    render(<Target onChangeTarget={onChangeTarget} onChange={onChange} />);

    await user.click(await screen.findByRole('button', { name: 'Select target' }));

    expect(onChangeTarget).toHaveBeenCalledWith(deployment);
    expect(onChange).toHaveBeenCalledOnce();

    expect(suiteUpdate).toBeDefined();
    const result = applySuiteUpdate(suiteUpdate!, suite);

    expect(result.deploymentRef?.id).toBe('new-target');
    expect(result.requestTemplate?.body?.content).toEqual({ model: 'new-target', input: 'hello' });
  });

  test('loads Core routes and selects a Route suite target', async () => {
    const user = userEvent.setup();
    const onChangeTarget = vi.fn();
    let suiteUpdate: SetStateAction<TestSuite> | undefined;
    const onChange = vi.fn((update: SetStateAction<TestSuite>) => {
      suiteUpdate = update;
    });
    gridTarget = routeTarget;

    render(<Target suiteType={SuiteType.Route} onChangeTarget={onChangeTarget} onChange={onChange} />);

    await user.click(await screen.findByRole('button', { name: 'Select target' }));

    expect(getRoutesMock).toHaveBeenCalledOnce();
    expect(onChangeTarget).toHaveBeenCalledWith(null);
    expect(screen.getByText('columns:name,author')).toBeTruthy();
    expect(screen.getByText('id-field:name')).toBeTruthy();
    expect(suiteUpdate).toBeDefined();
    expect(applySuiteUpdate(suiteUpdate!, {})).toMatchObject({
      suiteType: SuiteType.Route,
      routesRef: { name: 'routes/platform/search-route' },
    });
  });

  test('shows the route loading state until Core returns', async () => {
    let resolveRoutes: (routes: RouteTarget[]) => void = () => undefined;
    getRoutesMock.mockReturnValue(
      new Promise<RouteTarget[]>((resolve) => {
        resolveRoutes = resolve;
      }),
    );

    render(<Target suiteType={SuiteType.Route} onChangeTarget={vi.fn()} onChange={vi.fn()} />);

    expect(screen.getByRole('status')).toBeTruthy();

    await act(async () => resolveRoutes([routeTarget]));

    expect(await screen.findByRole('button', { name: 'Select target' })).toBeTruthy();
  });

  test.each([
    ['an empty response', () => getRoutesMock.mockResolvedValue([])],
    ['a failed request', () => getRoutesMock.mockRejectedValue(new Error('route list failed'))],
  ])('shows the No Routes state after %s', async (_case, arrangeRequest) => {
    arrangeRequest();

    render(<Target suiteType={SuiteType.Route} onChangeTarget={vi.fn()} onChange={vi.fn()} />);

    expect(await screen.findByText(EntitiesI18nKey.NoRoutes)).toBeTruthy();
  });

  test('clears the route reference after selecting an application target', async () => {
    const user = userEvent.setup();
    let suiteUpdate: SetStateAction<TestSuite> | undefined;
    const onChange = vi.fn((update: SetStateAction<TestSuite>) => {
      suiteUpdate = update;
    });

    render(<Target suiteType={SuiteType.Route} onChangeTarget={vi.fn()} onChange={onChange} />);

    await user.click(screen.getByRole('tab', { name: MenuI18nKey.Applications }));
    await user.click(await screen.findByRole('button', { name: 'Select target' }));

    expect(suiteUpdate).toBeDefined();
    const result = applySuiteUpdate(suiteUpdate!, {
      suiteType: SuiteType.Route,
      routesRef: { name: 'routes/platform/search-route' },
    });
    expect(result.routesRef).toBeUndefined();
    expect(result.suiteType).toBe(SuiteType.Deployment);
  });
});
