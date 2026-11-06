import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { useEntityReadOnlyAt } from '@/src/hooks/use-entity-read-only-at';
import { UnitNamespace } from '@/src/models/user-access';
import { ApplicationRoute } from '@/src/types/routes';

const appContext = vi.hoisted(() => ({
  isUnitMode: false,
  canWriteAt: vi.fn(),
  setEntityReadOnly: vi.fn(),
}));
vi.mock('@/src/context/AppContext', () => ({ useAppContext: () => appContext }));

describe('useEntityReadOnlyAt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appContext.isUnitMode = false;
    appContext.canWriteAt.mockReturnValue(true);
  });

  test('leaves the entity editable outside unit mode', () => {
    renderHook(() => useEntityReadOnlyAt(ApplicationRoute.Prompts, 'public/Acme/'));

    expect(appContext.setEntityReadOnly).toHaveBeenCalledWith(false);
    expect(appContext.canWriteAt).not.toHaveBeenCalled();
  });

  test('carries the view own reason outside unit mode', () => {
    renderHook(() => useEntityReadOnlyAt(ApplicationRoute.AssetsApplications, 'public/', true));

    expect(appContext.setEntityReadOnly).toHaveBeenCalledWith(true);
  });

  test('is editable in unit mode when the owning unit grants write', () => {
    appContext.isUnitMode = true;

    renderHook(() => useEntityReadOnlyAt(ApplicationRoute.Prompts, 'public/Acme/Risk/'));

    expect(appContext.canWriteAt).toHaveBeenCalledWith(UnitNamespace.PROMPTS, 'public/Acme/Risk/');
    expect(appContext.setEntityReadOnly).toHaveBeenCalledWith(false);
  });

  test('is read-only in unit mode when the owning unit does not grant write', () => {
    appContext.isUnitMode = true;
    appContext.canWriteAt.mockReturnValue(false);

    renderHook(() => useEntityReadOnlyAt(ApplicationRoute.Prompts, 'public/Acme/'));

    expect(appContext.setEntityReadOnly).toHaveBeenCalledWith(true);
  });

  test('is read-only in unit mode for a view with no namespace', () => {
    appContext.isUnitMode = true;

    renderHook(() => useEntityReadOnlyAt(ApplicationRoute.PlatformRoles, 'public/Acme/'));

    expect(appContext.setEntityReadOnly).toHaveBeenCalledWith(true);
    expect(appContext.canWriteAt).not.toHaveBeenCalled();
  });

  test('clears the override when the view unmounts', () => {
    const { unmount } = renderHook(() => useEntityReadOnlyAt(ApplicationRoute.Prompts, 'public/', true));

    unmount();

    expect(appContext.setEntityReadOnly).toHaveBeenLastCalledWith(false);
  });
});
