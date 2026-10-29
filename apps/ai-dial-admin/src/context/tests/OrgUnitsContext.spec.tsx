import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getOrgUnits } from '@/src/app/[lang]/folders-storage/actions';
import { OrgUnit } from '@/src/models/dial/org-unit';

vi.unmock('@/src/context/OrgUnitsContext');
vi.mock('@/src/app/[lang]/folders-storage/actions', () => ({
  getOrgUnits: vi.fn(),
}));

const unit: OrgUnit = {
  id: 'u1',
  name: 'Risk',
  displayName: 'Risk',
  path: 'public/Acme/Risk',
  folder: 'public/Acme/Risk/',
};

const renderProvider = async (groupClaim?: string) => {
  const { OrgUnitsProvider, useOrgUnits } =
    await vi.importActual<typeof import('../OrgUnitsContext')>('../OrgUnitsContext');

  const Probe = () => {
    const { unitsStatus, units, ensureUnits, refreshUnits, getOwningUnit, groupClaim: claim } = useOrgUnits();
    return (
      <div>
        <span>status:{unitsStatus}</span>
        <span>count:{Object.keys(units).length}</span>
        <span>claim:{claim}</span>
        <span>owner:{getOwningUnit('public/Acme/Risk/models/')?.name ?? 'none'}</span>
        <button onClick={ensureUnits}>ensure</button>
        <button onClick={() => void refreshUnits()}>refresh</button>
      </div>
    );
  };

  render(
    <OrgUnitsProvider groupClaim={groupClaim}>
      <Probe />
    </OrgUnitsProvider>,
  );
};

describe('OrgUnitsProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('stays idle until a consumer asks, then loads the unit map once', async () => {
    const user = userEvent.setup();
    vi.mocked(getOrgUnits).mockResolvedValue({ success: true, response: { items: [unit] } });
    await renderProvider();

    expect(screen.getByText('status:idle')).toBeTruthy();
    expect(getOrgUnits).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'ensure' }));
    await user.click(screen.getByRole('button', { name: 'ensure' }));

    expect(await screen.findByText('status:ready')).toBeTruthy();
    expect(screen.getByText('count:1')).toBeTruthy();
    expect(screen.getByText('owner:Risk')).toBeTruthy();
    expect(getOrgUnits).toHaveBeenCalledOnce();
  });

  test('is disabled when core answers 404', async () => {
    const user = userEvent.setup();
    vi.mocked(getOrgUnits).mockResolvedValue({ success: false, status: 404 });
    await renderProvider();

    await user.click(screen.getByRole('button', { name: 'ensure' }));

    expect(await screen.findByText('status:disabled')).toBeTruthy();
    expect(screen.getByText('count:0')).toBeTruthy();
  });

  test('is disabled when the caller may not list units', async () => {
    const user = userEvent.setup();
    vi.mocked(getOrgUnits).mockResolvedValue({ success: false, status: 403 });
    await renderProvider();

    await user.click(screen.getByRole('button', { name: 'ensure' }));

    expect(await screen.findByText('status:disabled')).toBeTruthy();
  });

  test('reports an error for a server failure and recovers on refresh', async () => {
    const user = userEvent.setup();
    vi.mocked(getOrgUnits).mockResolvedValueOnce({ success: false, status: 500 });
    await renderProvider();

    await user.click(screen.getByRole('button', { name: 'ensure' }));
    expect(await screen.findByText('status:error')).toBeTruthy();

    vi.mocked(getOrgUnits).mockResolvedValueOnce({ success: true, response: { items: [unit] } });
    await user.click(screen.getByRole('button', { name: 'refresh' }));

    expect(await screen.findByText('status:ready')).toBeTruthy();
    expect(getOrgUnits).toHaveBeenCalledTimes(2);
  });

  test('reports an error when the call throws', async () => {
    const user = userEvent.setup();
    vi.mocked(getOrgUnits).mockRejectedValue(new Error('network'));
    await renderProvider();

    await user.click(screen.getByRole('button', { name: 'ensure' }));

    expect(await screen.findByText('status:error')).toBeTruthy();
  });

  test('defaults the group claim and exposes a configured one', async () => {
    await renderProvider();
    expect(screen.getByText('claim:groups')).toBeTruthy();
  });

  test('exposes the configured group claim', async () => {
    await renderProvider('realm_access.roles');
    expect(screen.getByText('claim:realm_access.roles')).toBeTruthy();
  });
});
