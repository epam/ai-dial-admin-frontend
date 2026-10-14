import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { CREATE_RESPONSE_METHOD } from '@/src/components/TestSuites/constants/responses-method';
import { Deployment, RouteTarget } from '@/src/models/evaluation/deployment';
import { SuiteType, TestSuite } from '@/src/models/evaluation/test-suite';
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

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getDeployments: (...args: unknown[]) => getDeploymentsMock(...args),
  getRoutes: (...args: unknown[]) => getRoutesMock(...args),
}));

vi.mock('@/src/components/Grid/GridView/RadioSelectGrid', () => ({
  default: ({ onSelect }: { onSelect: (selected: Deployment | RouteTarget) => void }) => (
    <button type="button" onClick={() => onSelect(gridTarget)}>
      Select target
    </button>
  ),
}));

describe('Target', () => {
  beforeEach(() => {
    getDeploymentsMock.mockReset();
    getDeploymentsMock.mockResolvedValue({ response: [] });
    getRoutesMock.mockReset();
    getRoutesMock.mockResolvedValue([routeTarget]);
    gridTarget = deployment;
  });

  test('updates the target and reseeds its request model in one state update', async () => {
    const user = userEvent.setup();
    const onChangeTarget = vi.fn();
    const onChange = vi.fn();
    const suite = {
      endpointRef: CREATE_RESPONSE_METHOD,
      requestTemplate: { body: { content: { model: 'old-target', input: 'hello' } } },
    } as TestSuite;

    render(<Target onChangeTarget={onChangeTarget} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Select target' }));

    expect(onChangeTarget).toHaveBeenCalledWith(deployment);
    expect(onChange).toHaveBeenCalledOnce();

    const update = onChange.mock.calls[0][0] as (previous: TestSuite) => TestSuite;
    const result = update(suite);

    expect(result.deploymentRef?.id).toBe('new-target');
    expect(result.requestTemplate?.body?.content).toEqual({ model: 'new-target', input: 'hello' });
  });

  test('loads Core routes and selects a Route suite target', async () => {
    const user = userEvent.setup();
    const onChangeTarget = vi.fn();
    const onChange = vi.fn();
    gridTarget = routeTarget;

    render(<Target suiteType={SuiteType.Route} onChangeTarget={onChangeTarget} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Select target' }));

    expect(getRoutesMock).toHaveBeenCalledOnce();
    expect(onChangeTarget).toHaveBeenCalledWith(null);
    const update = onChange.mock.calls[0][0] as (previous: TestSuite) => TestSuite;
    expect(update({})).toMatchObject({
      suiteType: SuiteType.Route,
      routesRef: { name: 'routes/platform/search-route' },
    });
  });
});
