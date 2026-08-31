import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { getGridColumns } from '@/src/components/Assets/BaseAssetList/utils';
import { getGridActionLabels, getTreeActionLabels, getToolbarOptionLabels } from '@/src/components/Assets/utils';
import { FileManagerI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import SkillsList from '../List';

vi.mock('@/src/components/Assets/BaseAssetList/BaseAssetList', () => ({
  default: ({ view }: any) => <div>base-asset-list:{view}</div>,
}));

describe('SkillsList', () => {
  test('Should render BaseAssetList scoped to the skills view', () => {
    render(<SkillsList />);

    expect(screen.getByText(`base-asset-list:${ApplicationRoute.Skills}`)).toBeInTheDocument();
  });
});

describe('SkillsList :: list affordances', () => {
  test('Should offer Create > Folder and Create > Skill, but no import or export action', () => {
    const labels = getToolbarOptionLabels(ApplicationRoute.Skills, false);

    expect(labels.map((label) => label.key)).toEqual(['newFolder', 'newItem']);
    expect(labels.find((label) => label.key === 'newItem')?.label).toBe(FileManagerI18nKey.Skill);
  });

  test('Should offer delete and open-in-new-tab as row actions — but no move or duplicate', () => {
    const actions = getGridActionLabels(ApplicationRoute.Skills, false);

    expect(actions.map((action) => action.key)).toEqual(['delete', 'openInNewTab']);
  });

  test('Should offer no row actions to a read-only admin', () => {
    expect(getGridActionLabels(ApplicationRoute.Skills, true)).toEqual([]);
  });

  test('Should offer no folder-tree actions', () => {
    expect(getTreeActionLabels(false, ApplicationRoute.Skills)).toEqual([]);
  });
});

describe('SkillsList :: columns', () => {
  const columns = () => getGridColumns(ApplicationRoute.Skills, vi.fn(), {}, false);
  const versioned = () => getGridColumns(ApplicationRoute.Prompts, vi.fn(), {}, false);

  test('Should show exactly four metadata-backed columns', () => {
    expect(columns()).toHaveLength(4);
  });

  // Date columns are `(locale, options) => ColDef` factories the FileManager resolves, so `field`
  // only exists once invoked.
  const fieldsOf = (defs: any[]) =>
    defs.map((column) => (typeof column === 'function' ? column('en-US', void 0).field : column.field));

  test('Should include name, author, created-time, and updated-time columns', () => {
    const fields = fieldsOf(columns());

    expect(fields).toContain('author');
    expect(fields).toContain('createdAt');
    expect(fields).toContain('updatedAt');
  });

  test('Should not show a version column, unlike the versioned asset types', () => {
    expect(fieldsOf(columns())).not.toContain('version');
    expect(fieldsOf(versioned())).toContain('version');
  });
});
