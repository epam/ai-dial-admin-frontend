import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { getGridColumns } from '@/src/components/Assets/BaseAssetList/utils';
import { getGridActionLabels, getToolbarOptionLabels } from '@/src/components/Assets/utils';
import { FileManagerI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import AppRunnersList from '../List';

vi.mock('@/src/components/Assets/BaseAssetList/BaseAssetList', () => ({
  default: ({ view }: any) => <div>base-asset-list:{view}</div>,
}));

describe('AppRunnersList', () => {
  test('Should render BaseAssetList scoped to the app runners view', () => {
    render(<AppRunnersList />);

    expect(screen.getByText(`base-asset-list:${ApplicationRoute.AssetsAppRunners}`)).toBeInTheDocument();
  });
});

describe('AppRunnersList :: list affordances', () => {
  test('Should offer a create action in the toolbar', () => {
    const options = getToolbarOptionLabels(ApplicationRoute.AssetsAppRunners, false);

    expect(options).toEqual([{ key: 'newItem', label: FileManagerI18nKey.AppRunner, icon: null }]);
  });

  test('Should offer no create action to a read-only admin', () => {
    expect(getToolbarOptionLabels(ApplicationRoute.AssetsAppRunners, true)).toEqual([]);
  });

  test('Should offer only delete as a row action — no duplicate, move, or export', () => {
    const actions = getGridActionLabels(ApplicationRoute.AssetsAppRunners, false);

    expect(actions.map((action) => action.key)).toEqual(['delete']);
  });
});

describe('AppRunnersList :: columns', () => {
  const columns = () => getGridColumns(ApplicationRoute.AssetsAppRunners, vi.fn(), {}, false);
  const versioned = () => getGridColumns(ApplicationRoute.Prompts, vi.fn(), {}, false);

  test('Should show four metadata-backed columns', () => {
    expect(columns()).toHaveLength(4);
  });

  // Date columns are `(locale, options) => ColDef` factories the FileManager resolves, so `field`
  // only exists once invoked.
  const fieldsOf = (defs: any[]) =>
    defs.map((column) => (typeof column === 'function' ? column('en-US', void 0).field : column.field));

  test('Should include the author and created-time columns', () => {
    const fields = fieldsOf(columns());

    expect(fields).toContain('author');
    expect(fields).toContain('createdAt');
  });

  test('Should not show a version column, unlike the versioned asset types', () => {
    expect(fieldsOf(columns())).not.toContain('version');
    expect(fieldsOf(versioned())).toContain('version');
  });
});
