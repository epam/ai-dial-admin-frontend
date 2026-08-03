import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { EntitiesI18nKey } from '@/src/constants/i18n';
import { DialRole } from '@/src/models/dial/role';
import { DialAppRoute } from '@/src/models/dial/route';
import RouteRoles from '../RouteRoles';

const route = (overrides: Partial<DialAppRoute> = {}): DialAppRoute =>
  ({ name: 'route', roleLimits: {}, ...overrides }) as DialAppRoute;

const renderRoles = (props: { roles: DialRole[]; route: DialAppRoute; parentRoles?: string[] }) =>
  render(
    <RouteRoles
      route={props.route}
      roles={props.roles}
      parentRoles={props.parentRoles}
      onChangeRoute={vi.fn()}
      isAppRunnerView
    />,
  );

describe('RouteRoles :: granted roles absent from the option list', () => {
  afterEach(() => {
    cleanup();
  });

  test('displays a granted role that the fetched option list does not contain', async () => {
    renderRoles({
      roles: [{ name: 'listed', description: 'in the list' } as DialRole],
      route: route({ roleLimits: { listed: { enabled: true }, 'defined-in-config': { enabled: true } } }),
    });

    expect(await screen.findByText('listed')).toBeInTheDocument();
    // A role declared in Core's configuration files is granted and in effect, but absent from the
    // option list. Filtering the list by the grants would hide it while it still applies.
    expect(await screen.findByText('defined-in-config')).toBeInTheDocument();
  });

  test('displays every grant when the option read failed entirely', async () => {
    renderRoles({
      roles: [],
      route: route({ roleLimits: { admin: { enabled: true }, viewer: { enabled: true } } }),
    });

    expect(await screen.findByText('admin')).toBeInTheDocument();
    expect(await screen.findByText('viewer')).toBeInTheDocument();
  });

  test('prefers the fetched role so its description still renders', async () => {
    renderRoles({
      roles: [{ name: 'admin', description: 'full access' } as DialRole],
      route: route({ roleLimits: { admin: { enabled: true } } }),
    });

    expect(await screen.findByText('full access')).toBeInTheDocument();
  });

  test('shows inherited roles from the parent even when absent from the option list', async () => {
    renderRoles({
      roles: [],
      route: route({ isPublic: true }),
      parentRoles: ['inherited-role'],
    });

    expect(await screen.findByText('inherited-role')).toBeInTheDocument();
  });

  test('shows no rows when nothing is granted', async () => {
    renderRoles({ roles: [{ name: 'available' } as DialRole], route: route() });

    // Waits for the empty state before asserting absence — a synchronous `queryByText` here would
    // pass simply because the grid had not rendered yet.
    expect(await screen.findByText(EntitiesI18nKey.NoRoles)).toBeInTheDocument();
    expect(screen.queryByText('available')).not.toBeInTheDocument();
  });
});
