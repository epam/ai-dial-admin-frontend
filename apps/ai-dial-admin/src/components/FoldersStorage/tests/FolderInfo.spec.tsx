import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { EntitiesI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { useOrgUnits } from '@/src/context/OrgUnitsContext';
import { useRuleFolder } from '@/src/context/RuleFolderContext';
import { DialFolder } from '@/src/models/dial/folder';
import { OrgUnit, OrgUnitsStatus } from '@/src/models/dial/org-unit';
import { getOwningUnit, toUnitMap } from '@/src/utils/org-units/units';
import FolderInfo from '../FolderInfo';

vi.mock('@/src/context/RuleFolderContext', () => ({ useRuleFolder: vi.fn() }));
vi.mock('@/src/components/Rules/RulesList', () => ({ default: () => <div>rules-editor</div> }));
vi.mock('../UnitInfo', () => ({ default: ({ unit }: { unit: OrgUnit }) => <div>unit-body:{unit.name}</div> }));

const unit: OrgUnit = {
  id: 'u1',
  name: 'Risk',
  displayName: 'Risk Dept',
  path: 'public/Acme/Risk',
  folder: 'public/Acme/Risk/',
};
const UNITS = toUnitMap([unit]);

const buildContext = (filePath: string, overrides: Record<string, unknown> = {}) => ({
  currentFolder: { name: 'folder', path: filePath } as DialFolder,
  fetchedFoldersRule: { [filePath]: { [filePath]: [] } },
  filePath,
  fetchRules: vi.fn(),
  isLoading: false,
  files: [{ name: 'public', path: 'public/' }],
  toggleFolder: vi.fn(),
  ...overrides,
});

const mockContext = (filePath: string, overrides: Record<string, unknown> = {}) => {
  const context = buildContext(filePath, overrides);
  vi.mocked(useRuleFolder).mockReturnValue(context as unknown as ReturnType<typeof useRuleFolder>);
  return context;
};

const mockUnits = (units: Record<string, OrgUnit>, unitsStatus: OrgUnitsStatus) => {
  const orgUnits = {
    units,
    unitsStatus,
    groupClaim: 'groups',
    ensureUnits: vi.fn(),
    refreshUnits: vi.fn(),
    getOwningUnit: (path: string) => getOwningUnit(units, path),
  };
  vi.mocked(useOrgUnits).mockReturnValue(orgUnits);
  return orgUnits;
};

describe('FolderInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUnits(UNITS, OrgUnitsStatus.READY);
  });

  test('shows the rules editor for a folder under no unit', () => {
    mockContext('public/Handbook/');
    render(<FolderInfo />);

    expect(screen.getByText('rules-editor')).toBeTruthy();
    expect(screen.queryByText(/unit-body/)).toBeNull();
  });

  test('shows the unit body for a unit', () => {
    mockContext('public/Acme/Risk/');
    render(<FolderInfo />);

    expect(screen.getByText('unit-body:Risk')).toBeTruthy();
    expect(screen.queryByText('rules-editor')).toBeNull();
  });

  test('shows a note and no rules editor for a folder inside a unit', async () => {
    const user = userEvent.setup();
    const context = mockContext('public/Acme/Risk/models/');
    render(<FolderInfo />);

    expect(screen.getByText(FoldersI18nKey.InsideUnitNote)).toBeTruthy();
    expect(screen.queryByText('rules-editor')).toBeNull();

    await user.click(screen.getByRole('button', { name: FoldersI18nKey.OpenUnit }));
    expect(context.toggleFolder).toHaveBeenCalledWith(expect.objectContaining({ path: 'public/Acme/Risk/' }), true);
  });

  test('keeps the rules editor when units are off', () => {
    mockUnits({}, OrgUnitsStatus.DISABLED);
    mockContext('public/Handbook/');
    render(<FolderInfo />);

    expect(screen.getByText('rules-editor')).toBeTruthy();
  });

  test('shows a load error with retry instead of the rules editor when units failed', async () => {
    const user = userEvent.setup();
    const orgUnits = mockUnits({}, OrgUnitsStatus.ERROR);
    mockContext('public/Handbook/');
    render(<FolderInfo />);

    expect(screen.getByText(FoldersI18nKey.UnitsLoadError)).toBeTruthy();
    expect(screen.queryByText('rules-editor')).toBeNull();

    await user.click(screen.getByRole('button', { name: FoldersI18nKey.UnitsRetry }));
    expect(orgUnits.refreshUnits).toHaveBeenCalledOnce();
  });

  test('shows a spinner-free empty state when no folder is selected', () => {
    mockContext('', { currentFolder: undefined });
    render(<FolderInfo />);

    expect(screen.getByText(EntitiesI18nKey.NoFolders)).toBeTruthy();
  });
});
