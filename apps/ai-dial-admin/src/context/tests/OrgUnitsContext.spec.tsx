import { useState } from 'react';
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

const renderProvider = async () => {
  const { OrgUnitsProvider, useOrgUnits } =
    await vi.importActual<typeof import('../OrgUnitsContext')>('../OrgUnitsContext');

  const Probe = () => {
    const { unitsStatus, units, ensureUnits, refreshUnits, loadUnits, getOwningUnit } = useOrgUnits();
    const [result, setResult] = useState('result:none');
    return (
      <div>
        <span>{result}</span>
        <button onClick={async () => setResult(`result:load:${Object.keys(await loadUnits()).length}`)}>load</button>
        <button onClick={async () => setResult(`result:refresh:${Object.keys(await refreshUnits()).length}`)}>
          refresh and read
        </button>
        <span>status:{unitsStatus}</span>
        <span>count:{Object.keys(units).length}</span>
        <span>owner:{getOwningUnit('public/Acme/Risk/models/')?.name ?? 'none'}</span>
        <button onClick={ensureUnits}>ensure</button>
        <button onClick={() => void refreshUnits()}>refresh</button>
      </div>
    );
  };

  render(
    <OrgUnitsProvider>
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

  test('loadUnits starts the first read, and a concurrent call shares it', async () => {
    const user = userEvent.setup();
    vi.mocked(getOrgUnits).mockResolvedValue({ success: true, response: { items: [unit] } });
    await renderProvider();

    await user.click(screen.getByRole('button', { name: 'load' }));
    await user.click(screen.getByRole('button', { name: 'load' }));

    expect(await screen.findByText('result:load:1')).toBeTruthy();
    expect(getOrgUnits).toHaveBeenCalledOnce();
  });

  test('loadUnits answers from the loaded map without another read', async () => {
    const user = userEvent.setup();
    vi.mocked(getOrgUnits).mockResolvedValue({ success: true, response: { items: [unit] } });
    await renderProvider();
    await user.click(screen.getByRole('button', { name: 'ensure' }));
    expect(await screen.findByText('status:ready')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'load' }));

    expect(await screen.findByText('result:load:1')).toBeTruthy();
    expect(getOrgUnits).toHaveBeenCalledOnce();
  });

  test('loadUnits waits for a read that is already in flight', async () => {
    const user = userEvent.setup();
    let resolveRead: (value: Awaited<ReturnType<typeof getOrgUnits>>) => void = () => {};
    vi.mocked(getOrgUnits).mockReturnValue(
      new Promise((resolve) => {
        resolveRead = resolve;
      }),
    );
    await renderProvider();
    await user.click(screen.getByRole('button', { name: 'ensure' }));

    await user.click(screen.getByRole('button', { name: 'load' }));
    expect(screen.getByText('result:none')).toBeTruthy();

    resolveRead({ success: true, response: { items: [unit] } });

    expect(await screen.findByText('result:load:1')).toBeTruthy();
    expect(getOrgUnits).toHaveBeenCalledOnce();
  });

  test('loadUnits resolves with no units instead of rejecting when the read throws', async () => {
    const user = userEvent.setup();
    vi.mocked(getOrgUnits).mockRejectedValue(new Error('network'));
    await renderProvider();

    await user.click(screen.getByRole('button', { name: 'load' }));

    expect(await screen.findByText('result:load:0')).toBeTruthy();
  });

  test('refreshUnits resolves with the map it loaded', async () => {
    const user = userEvent.setup();
    vi.mocked(getOrgUnits).mockResolvedValue({ success: true, response: { items: [unit] } });
    await renderProvider();

    await user.click(screen.getByRole('button', { name: 'refresh and read' }));

    expect(await screen.findByText('result:refresh:1')).toBeTruthy();
  });

  test('keeps the last good map when a later read fails', async () => {
    const user = userEvent.setup();
    vi.mocked(getOrgUnits).mockResolvedValueOnce({ success: true, response: { items: [unit] } });
    await renderProvider();
    await user.click(screen.getByRole('button', { name: 'ensure' }));
    expect(await screen.findByText('status:ready')).toBeTruthy();

    vi.mocked(getOrgUnits).mockResolvedValueOnce({ success: false, status: 500 });
    await user.click(screen.getByRole('button', { name: 'refresh and read' }));

    expect(await screen.findByText('result:refresh:1')).toBeTruthy();
    expect(screen.getByText('status:error')).toBeTruthy();
    expect(screen.getByText('count:1')).toBeTruthy();
  });

  test('empties the map and makes no further request once org units answered as off', async () => {
    const user = userEvent.setup();
    vi.mocked(getOrgUnits).mockResolvedValueOnce({ success: true, response: { items: [unit] } });
    await renderProvider();
    await user.click(screen.getByRole('button', { name: 'ensure' }));
    expect(await screen.findByText('count:1')).toBeTruthy();

    vi.mocked(getOrgUnits).mockResolvedValueOnce({ success: false, status: 404 });
    await user.click(screen.getByRole('button', { name: 'refresh' }));
    expect(await screen.findByText('status:disabled')).toBeTruthy();
    expect(screen.getByText('count:0')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'refresh and read' }));

    expect(await screen.findByText('result:refresh:0')).toBeTruthy();
    expect(getOrgUnits).toHaveBeenCalledTimes(2);
  });
});
