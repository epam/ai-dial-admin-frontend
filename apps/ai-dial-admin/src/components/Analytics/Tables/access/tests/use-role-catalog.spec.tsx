import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getRoles } from '@/src/app/[lang]/tables/actions';
import { useRoleCatalog } from '@/src/components/Analytics/Tables/access/use-role-catalog';
import { AnalyticsTablesI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { ConfigEntityRow } from '@/src/models/dial/config-file';
import { ConfigEntityOrigin } from '@/src/types/config-file-entity';

const showNotification = vi.hoisted(() => vi.fn());
vi.mock('@/src/context/NotificationContext', () => ({ useNotification: () => ({ showNotification }) }));
vi.mock('@/src/app/[lang]/tables/actions');

const role = (displayName?: string, origin = ConfigEntityOrigin.ConfigFile) =>
  ({ displayName, origin }) as ConfigEntityRow;
const entry = (name: string, origin = ConfigEntityOrigin.ConfigFile) => ({ name, origin });

beforeEach(() => vi.clearAllMocks());

describe('useRoleCatalog', () => {
  test('returns the role names sorted ignoring case', async () => {
    vi.mocked(getRoles).mockResolvedValue({ roles: [role('team-z'), role('Analysts'), role('team-x')], warnings: [] });

    const { result } = renderHook(() => useRoleCatalog(true));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.roles).toEqual([entry('Analysts'), entry('team-x'), entry('team-z')]);
  });

  test('keeps the population each role came from', async () => {
    vi.mocked(getRoles).mockResolvedValue({
      roles: [role('team-x', ConfigEntityOrigin.Api), role('team-y')],
      warnings: [],
    });

    const { result } = renderHook(() => useRoleCatalog(true));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.roles).toEqual([entry('team-x', ConfigEntityOrigin.Api), entry('team-y')]);
  });

  test('drops entries that carry no name', async () => {
    vi.mocked(getRoles).mockResolvedValue({ roles: [role('team-x'), role(undefined), role('')], warnings: [] });

    const { result } = renderHook(() => useRoleCatalog(true));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.roles).toEqual([entry('team-x')]);
  });

  test('notifies of a partial or failed read and keeps what could be read', async () => {
    vi.mocked(getRoles).mockResolvedValue({
      roles: [role('team-x')],
      warnings: [EntitiesI18nKey.OptionListPartial],
    });

    const { result } = renderHook(() => useRoleCatalog(true));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.roles).toEqual([entry('team-x')]);
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: AnalyticsTablesI18nKey.RolesLoadFailed,
        description: EntitiesI18nKey.OptionListPartial,
      }),
    );
  });

  test('requests nothing while disabled', () => {
    const { result } = renderHook(() => useRoleCatalog(false));

    expect(getRoles).not.toHaveBeenCalled();
    expect(result.current).toEqual({ roles: [], isLoading: false });
  });

  test('reports loading until the read resolves', () => {
    vi.mocked(getRoles).mockReturnValue(new Promise(() => undefined));

    const { result } = renderHook(() => useRoleCatalog(true));

    expect(result.current.isLoading).toBe(true);
  });
});
