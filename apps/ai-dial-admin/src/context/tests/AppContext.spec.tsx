import { renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { describe, expect, test, vi } from 'vitest';

import { AppContextProvider, useAppContext } from '@/src/context/AppContext';
import { FeatureFlags } from '@/src/models/feature-flags';
import { AccessMode, AdminAccess, UnitAction, UnitNamespace, UserAccess, UserOrgUnit } from '@/src/models/user-access';

vi.unmock('@/src/context/AppContext');

const featureFlags = { adminApiEnabled: true } as FeatureFlags;

const unit = (folder: string, permissions: UserOrgUnit['permissions']): UserOrgUnit => ({
  id: folder,
  name: folder,
  displayName: folder,
  path: folder.replace(/\/$/, ''),
  folder,
  roles: [],
  permissions,
});

const UNIT_ACCESS: UserAccess = {
  mode: AccessMode.UNIT,
  adminAccess: AdminAccess.NONE,
  units: [unit('public/Acme/Risk/', { [UnitNamespace.APPLICATIONS]: [UnitAction.READ, UnitAction.WRITE] })],
};

const renderContext = (userAccess?: UserAccess) =>
  renderHook(() => useAppContext(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <AppContextProvider featureFlags={featureFlags} userAccess={userAccess}>
        {children}
      </AppContextProvider>
    ),
  }).result.current;

describe('AppContext — access', () => {
  test('treats the caller as a full admin when no access is supplied', () => {
    const context = renderContext();

    expect(context.isFullAdmin).toBe(true);
    expect(context.isUnitMode).toBe(false);
    expect(context.isReadOnlyAdmin).toBe(false);
  });

  test('is a full admin who may read and write anywhere for adminAccess FULL', () => {
    const context = renderContext({ mode: AccessMode.FULL, adminAccess: AdminAccess.FULL, units: [] });

    expect(context.isFullAdmin).toBe(true);
    expect(context.canReadNamespace(UnitNamespace.PROMPTS)).toBe(true);
    expect(context.canWriteAt(UnitNamespace.PROMPTS, 'public/Anywhere/')).toBe(true);
  });

  test('is neither full admin nor read-only in unit mode', () => {
    const context = renderContext(UNIT_ACCESS);

    expect(context.isFullAdmin).toBe(false);
    expect(context.isUnitMode).toBe(true);
    expect(context.isReadOnlyAdmin).toBe(false);
  });

  test('follows the unit grants for reads and writes in unit mode', () => {
    const context = renderContext(UNIT_ACCESS);

    expect(context.canReadNamespace(UnitNamespace.APPLICATIONS)).toBe(true);
    expect(context.canReadNamespace(UnitNamespace.PROMPTS)).toBe(false);
    expect(context.canWriteAt(UnitNamespace.APPLICATIONS, 'public/Acme/Risk/app/')).toBe(true);
    expect(context.canWriteAt(UnitNamespace.APPLICATIONS, 'public/Acme/')).toBe(false);
  });

  test('is read-only, not full, when Core reports READ_ONLY', () => {
    const context = renderContext({ mode: AccessMode.FULL, adminAccess: AdminAccess.READ_ONLY, units: [] });

    expect(context.isReadOnlyAdmin).toBe(true);
    expect(context.isFullAdmin).toBe(false);
    expect(context.canWriteAt(UnitNamespace.PROMPTS, 'public/Acme/')).toBe(false);
  });
});
