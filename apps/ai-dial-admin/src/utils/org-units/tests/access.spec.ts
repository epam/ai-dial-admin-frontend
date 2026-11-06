import { describe, expect, test } from 'vitest';

import { UnitAction, UnitNamespace, UserOrgUnit } from '@/src/models/user-access';
import { canDecidePublicationAt, canReadNamespace, canWriteAt, hasActionAt } from '@/src/utils/org-units/access';

const unit = (folder: string, permissions: UserOrgUnit['permissions']): UserOrgUnit => ({
  id: folder,
  name: folder,
  displayName: folder,
  path: folder.replace(/\/$/, ''),
  folder,
  roles: [],
  permissions,
});

const UNITS = [
  unit('public/Acme/', { [UnitNamespace.ORG_UNITS]: [UnitAction.READ] }),
  unit('public/Acme/Risk/', {
    [UnitNamespace.APPLICATIONS]: [UnitAction.READ, UnitAction.WRITE],
    [UnitNamespace.PUBLICATIONS]: [UnitAction.READ, UnitAction.WRITE],
  }),
  unit('public/Other/', { [UnitNamespace.PUBLICATIONS]: [UnitAction.READ] }),
];

describe('canReadNamespace', () => {
  test('is true when any unit grants read', () => {
    expect(canReadNamespace(UNITS, UnitNamespace.APPLICATIONS)).toBe(true);
    expect(canReadNamespace(UNITS, UnitNamespace.ORG_UNITS)).toBe(true);
  });

  test('is false when no unit grants it', () => {
    expect(canReadNamespace(UNITS, UnitNamespace.PROMPTS)).toBe(false);
  });

  test('is false for no units, and for a unit with empty permissions', () => {
    expect(canReadNamespace([], UnitNamespace.FILES)).toBe(false);
    expect(canReadNamespace([unit('public/Bare/', {})], UnitNamespace.FILES)).toBe(false);
  });
});

describe('canWriteAt', () => {
  test('follows the nearest owning unit', () => {
    expect(canWriteAt(UNITS, UnitNamespace.APPLICATIONS, 'public/Acme/Risk/models/')).toBe(true);
  });

  test('does not borrow a deeper unit for its parent', () => {
    expect(canWriteAt(UNITS, UnitNamespace.APPLICATIONS, 'public/Acme/')).toBe(false);
  });

  test('is false when no unit owns the path, or a name merely shares the prefix', () => {
    expect(canWriteAt(UNITS, UnitNamespace.APPLICATIONS, 'public/Elsewhere/')).toBe(false);
    expect(canWriteAt(UNITS, UnitNamespace.APPLICATIONS, 'public/Acme/Risk2/')).toBe(false);
  });

  test('matches an encoded folder against a decoded path', () => {
    const units = [unit('public/US%20Risk/', { [UnitNamespace.FILES]: [UnitAction.WRITE] })];

    expect(canWriteAt(units, UnitNamespace.FILES, 'public/US Risk/docs')).toBe(true);
  });
});

describe('hasActionAt', () => {
  test('checks one action at the owning unit', () => {
    expect(hasActionAt(UNITS, UnitNamespace.PUBLICATIONS, UnitAction.READ, 'public/Other/x')).toBe(true);
    expect(hasActionAt(UNITS, UnitNamespace.PUBLICATIONS, UnitAction.WRITE, 'public/Other/x')).toBe(false);
  });
});

describe('canDecidePublicationAt', () => {
  test('needs read and write on publications at every touched path', () => {
    expect(canDecidePublicationAt(UNITS, ['public/Acme/Risk/', 'public/Acme/Risk/app/1.0'])).toBe(true);
  });

  test('is false when one touched unit lacks write', () => {
    expect(canDecidePublicationAt(UNITS, ['public/Acme/Risk/', 'public/Other/app'])).toBe(false);
  });

  test('is false when one touched path has no owning unit', () => {
    expect(canDecidePublicationAt(UNITS, ['public/Acme/Risk/', 'public/Nobody/app'])).toBe(false);
  });

  test('is false with nothing touched', () => {
    expect(canDecidePublicationAt(UNITS, [])).toBe(false);
  });
});
