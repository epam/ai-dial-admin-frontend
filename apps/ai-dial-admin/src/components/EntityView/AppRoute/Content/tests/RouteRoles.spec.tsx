import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { ActionMenuOperationI18nKey, ButtonsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { DialRole } from '@/src/models/dial/role';
import { DialAppRoute } from '@/src/models/dial/route';
import { ConfigEntityOrigin } from '@/src/types/config-file-entity';
import RouteRoles from '../RouteRoles';

const route = (overrides: Partial<DialAppRoute> = {}): DialAppRoute =>
  ({ name: 'route', roleLimits: {}, ...overrides }) as DialAppRoute;

const renderRoles = (props: {
  roles: DialRole[];
  route: DialAppRoute;
  parentRoles?: string[];
  isCoreRoleSource?: boolean;
  disabled?: boolean;
  onChangeRoute?: (route: DialAppRoute) => void;
}) =>
  render(
    <RouteRoles
      route={props.route}
      roles={props.roles}
      parentRoles={props.parentRoles}
      onChangeRoute={props.onChangeRoute ?? vi.fn()}
      isCoreRoleSource={props.isCoreRoleSource ?? true}
      disabled={props.disabled}
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

  test.each([
    ['complete', [{ name: 'role% /?#', origin: ConfigEntityOrigin.ConfigFile } as DialRole]],
    ['partial', [{ name: 'other', origin: ConfigEntityOrigin.Api } as DialRole]],
    ['empty', []],
  ])('opens a Core reference with %s role options without changing membership', async (_state, roles) => {
    const user = userEvent.setup();
    const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => null);
    const onChangeRoute = vi.fn();
    const name = 'role% /?#';
    renderRoles({ roles, route: route({ roleLimits: { [name]: { enabled: true } } }), onChangeRoute });

    await screen.findByText(name);
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Actions }));
    await user.click(screen.getByText(ActionMenuOperationI18nKey.Open_in_new_tab));

    expect(windowOpen).toHaveBeenCalledWith('/platform-roles/role%25%20%2F%3F%23', '_blank');
    const openedUrl = windowOpen.mock.calls[0][0] as string;
    expect(decodeURIComponent(openedUrl.split('/').pop() as string)).toBe(name);
    expect(onChangeRoute).not.toHaveBeenCalled();
    windowOpen.mockRestore();
  });

  test('retains legacy navigation even when an option has a Core origin', async () => {
    const user = userEvent.setup();
    const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => null);
    renderRoles({
      roles: [{ name: 'admin', origin: ConfigEntityOrigin.Api } as DialRole],
      route: route({ roleLimits: { admin: { enabled: true } } }),
      isCoreRoleSource: false,
    });

    await screen.findByText('admin');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Actions }));
    await user.click(screen.getByText(ActionMenuOperationI18nKey.Open_in_new_tab));
    expect(windowOpen).toHaveBeenCalledWith('/roles/admin', '_blank');
    windowOpen.mockRestore();
  });

  test('keeps navigation but hides removal in a read-only inherited view', async () => {
    const user = userEvent.setup();
    const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => null);
    renderRoles({ roles: [], route: route({ isPublic: true }), parentRoles: ['inherited'], disabled: true });

    await screen.findByText('inherited');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Actions }));
    expect(screen.queryByText(ActionMenuOperationI18nKey.Remove)).not.toBeInTheDocument();
    await user.click(screen.getByText(ActionMenuOperationI18nKey.Open_in_new_tab));
    expect(windowOpen).toHaveBeenCalledWith('/platform-roles/inherited', '_blank');
    windowOpen.mockRestore();
  });

  test('keeps navigation but hides removal for a read-only explicit grant', async () => {
    const user = userEvent.setup();
    const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => null);
    renderRoles({ roles: [], route: route({ roleLimits: { admin: { enabled: true } } }), disabled: true });

    await screen.findByText('admin');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Actions }));
    expect(screen.queryByText(ActionMenuOperationI18nKey.Remove)).not.toBeInTheDocument();
    await user.click(screen.getByText(ActionMenuOperationI18nKey.Open_in_new_tab));
    expect(windowOpen).toHaveBeenCalledWith('/platform-roles/admin', '_blank');
    windowOpen.mockRestore();
  });

  test('retains removal for editable grants', async () => {
    const user = userEvent.setup();
    const onChangeRoute = vi.fn();
    renderRoles({ roles: [], route: route({ roleLimits: { admin: { enabled: true } } }), onChangeRoute });

    await screen.findByText('admin');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Actions }));
    await user.click(screen.getByText(ActionMenuOperationI18nKey.Remove));
    expect(onChangeRoute).toHaveBeenCalledWith(expect.objectContaining({ roleLimits: {} }));
  });

  test('shows no rows when nothing is granted', async () => {
    renderRoles({ roles: [{ name: 'available' } as DialRole], route: route() });

    // Waits for the empty state before asserting absence — a synchronous `queryByText` here would
    // pass simply because the grid had not rendered yet.
    expect(await screen.findByText(EntitiesI18nKey.NoRoles)).toBeInTheDocument();
    expect(screen.queryByText('available')).not.toBeInTheDocument();
  });
});
