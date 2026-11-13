import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { getFlatAssetColumns } from '@/src/components/Assets/FlatAssetGrid/columns';
import { AssetSource } from '@/src/models/dial/asset-source';
import { ApplicationRoute } from '@/src/types/routes';
import AppRunnersList from '../List';

vi.mock('@/src/components/Assets/TabbedAssetList/TabbedAssetList', () => ({
  default: ({ view }: any) => <div>base-asset-list:{view}</div>,
}));

describe('AppRunnersList', () => {
  test('Should render TabbedAssetList scoped to the app runners view', () => {
    render(<AppRunnersList />);

    expect(screen.getByText(`base-asset-list:${ApplicationRoute.PlatformAppRunners}`)).toBeInTheDocument();
  });
});

describe('AppRunnersList :: columns', () => {
  const labels = { name: 'Name', costObject: 'Cost object' };
  const platform = () =>
    getFlatAssetColumns(ApplicationRoute.PlatformAppRunners, AssetSource.Platform, () => undefined, labels);
  // Prompts are versionless now too, so the versioned contrast is not part of the flat grid at all.
  const fieldsOf = () => platform().map((column) => column.field ?? column.colId);

  test('Should show four metadata-backed columns', () => {
    expect(platform()).toHaveLength(4);
  });

  test('Should include the author and created-time columns', () => {
    expect(fieldsOf()).toContain('author');
    expect(fieldsOf()).toContain('createdAt');
  });

  test('Should not show a version column, unlike the versioned asset types', () => {
    expect(fieldsOf()).not.toContain('version');
  });

  test('Should list names only on the config.json tab', () => {
    const columns = getFlatAssetColumns(
      ApplicationRoute.PlatformAppRunners,
      AssetSource.ConfigFile,
      () => undefined,
      labels,
    );

    expect(columns.map((column) => column.colId)).toEqual(['name']);
  });
});
