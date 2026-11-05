import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { RolesCardStatus } from '@/src/components/FoldersStorage/models';
import { useUnitRolesDraft } from '@/src/components/FoldersStorage/use-unit-roles-draft';
import { ActionMenuOperationI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { UnitAction, UnitNamespace, UserOrgUnit } from '@/src/models/user-access';
import UnitInfo from '../UnitInfo';

vi.mock('../use-unit-roles-draft', () => ({ useUnitRolesDraft: vi.fn() }));
vi.mock('../UnitRolesCard', () => ({
  default: ({ isReadonly }: { isReadonly?: boolean }) => <div>roles-card:{isReadonly ? 'readonly' : 'editable'}</div>,
}));
vi.mock('../NewUnitButton', () => ({ default: () => <button>new-unit</button> }));
vi.mock('../Modals/RenameUnitModal', () => ({ default: () => null }));
vi.mock('../Modals/RemoveUnitModal', () => ({ default: () => null }));

const appContext = vi.hoisted(() => ({ isUnitMode: false, userAccess: { units: [] as UserOrgUnit[] } }));
vi.mock('@/src/context/AppContext', () => ({ useAppContext: () => appContext }));

const UNIT: UserOrgUnit = {
  id: '1',
  name: 'Risk',
  displayName: 'Risk',
  path: 'public/Acme/Risk',
  folder: 'public/Acme/Risk/',
  roles: [],
  permissions: {},
};

const grant = (permissions: UserOrgUnit['permissions']) => {
  appContext.isUnitMode = true;
  appContext.userAccess.units = [{ ...UNIT, permissions }];
};

describe('UnitInfo — unit mode', () => {
  beforeEach(() => {
    vi.mocked(useUnitRolesDraft).mockReturnValue({
      status: RolesCardStatus.READY,
      roles: [],
      draft: [],
      isChanged: false,
      isSaving: false,
      discard: vi.fn(),
      save: vi.fn(),
      addHolder: vi.fn(),
      removeHolder: vi.fn(),
    } as unknown as ReturnType<typeof useUnitRolesDraft>);
    appContext.isUnitMode = false;
    appContext.userAccess.units = [];
  });

  afterEach(() => {
    appContext.isUnitMode = false;
    appContext.userAccess.units = [];
  });

  test('keeps the unit actions and an editable roles card outside unit mode', () => {
    render(<UnitInfo unit={UNIT} />);

    expect(useUnitRolesDraft).toHaveBeenCalledWith(UNIT.path, true);
    expect(screen.getByRole('button', { name: ActionMenuOperationI18nKey.Rename })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: FoldersI18nKey.RemoveUnit })).toBeInTheDocument();
    expect(screen.getByText('roles-card:editable')).toBeInTheDocument();
  });

  test('asks core for assignments only when role-assignments read is granted', () => {
    grant({ [UnitNamespace.ROLE_ASSIGNMENTS]: [UnitAction.READ] });
    render(<UnitInfo unit={UNIT} />);

    expect(useUnitRolesDraft).toHaveBeenCalledWith(UNIT.path, true);
  });

  test('does not ask core for assignments without role-assignments read', () => {
    grant({ [UnitNamespace.ORG_UNITS]: [UnitAction.READ] });
    render(<UnitInfo unit={UNIT} />);

    expect(useUnitRolesDraft).toHaveBeenCalledWith(UNIT.path, false);
  });

  test('shows a read-only roles card and no unit actions with read access only', () => {
    grant({ [UnitNamespace.ROLE_ASSIGNMENTS]: [UnitAction.READ], [UnitNamespace.ORG_UNITS]: [UnitAction.READ] });
    render(<UnitInfo unit={UNIT} />);

    expect(screen.getByText('roles-card:readonly')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: ActionMenuOperationI18nKey.Rename })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: FoldersI18nKey.RemoveUnit })).not.toBeInTheDocument();
  });

  test('allows editing roles and managing the unit with write on both namespaces', () => {
    grant({
      [UnitNamespace.ROLE_ASSIGNMENTS]: [UnitAction.READ, UnitAction.WRITE],
      [UnitNamespace.ORG_UNITS]: [UnitAction.READ, UnitAction.WRITE],
    });
    render(<UnitInfo unit={UNIT} />);

    expect(screen.getByText('roles-card:editable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ActionMenuOperationI18nKey.Rename })).toBeInTheDocument();
  });
});
