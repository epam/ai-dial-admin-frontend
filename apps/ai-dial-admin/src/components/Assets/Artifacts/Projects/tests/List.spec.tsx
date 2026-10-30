import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { getGridColumns } from '@/src/components/Assets/BaseAssetList/utils';
import { getGridActionLabels, getTreeActionLabels, getToolbarOptionLabels } from '@/src/components/Assets/utils';
import { FileManagerI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import ProjectsList from '../List';

vi.mock('@/src/components/Assets/BaseAssetList/BaseAssetList', () => ({
  default: ({ view }: any) => <div>base-asset-list:{view}</div>,
}));

describe('ProjectsList', () => {
  test('Should render BaseAssetList scoped to the projects view', () => {
    render(<ProjectsList />);

    expect(screen.getByText(`base-asset-list:${ApplicationRoute.Projects}`)).toBeInTheDocument();
  });
});

describe('ProjectsList :: list affordances', () => {
  test('Should offer Create > Folder and Create > Project, but no import or export action', () => {
    const labels = getToolbarOptionLabels(ApplicationRoute.Projects, false);

    expect(labels.map((label) => label.key)).toEqual(['newFolder', 'newItem']);
    expect(labels.find((label) => label.key === 'newItem')?.label).toBe(FileManagerI18nKey.Project);
  });

  test('Should offer the folder actions and open-in-new-tab as row actions — but no move, rename or duplicate', () => {
    const actions = getGridActionLabels(ApplicationRoute.Projects, false);

    expect(actions.map((action) => action.key)).toEqual([
      'addSibling',
      'addChild',
      'managePermissions',
      'delete',
      'openInNewTab',
    ]);
  });

  test('Should offer no row actions to a read-only admin', () => {
    expect(getGridActionLabels(ApplicationRoute.Projects, true)).toEqual([]);
  });

  test('Should offer add sibling, add child, manage permissions and delete as folder-tree actions', () => {
    expect(getTreeActionLabels(false, ApplicationRoute.Projects).map((action) => action.key)).toEqual([
      'addSibling',
      'addChild',
      'managePermissions',
      'delete',
    ]);
  });
});

describe('ProjectsList :: columns', () => {
  const columns = () => getGridColumns(ApplicationRoute.Projects);
  // Prompts are versionless now too, so the versioned contrast is a deployment-asset view.
  const versioned = () => getGridColumns(ApplicationRoute.AssetsApplications);

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
