import { useRouter } from 'next/navigation';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { ColDef } from 'ag-grid-community';

import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import DisplayNameCellRenderer from '@/src/components/Grid/CellRenderers/DisplayNameCellRenderer';
import LinkCellRenderer from '@/src/components/Grid/CellRenderers/LinkCellRenderer';
import { DISPLAY_NAME_COLUMN } from '@/src/constants/grid-columns/base-columns';
import { ApplicationRoute } from '@/src/types/routes';
import * as openInNewTabUtils from '@/src/utils/open-in-new-tab';

let capturedOpen: ((entity?: unknown) => void) | undefined;
let capturedGetHref: ((data: unknown) => string | undefined) | undefined;
let capturedColumns: ColDef[] | undefined;
let capturedGridOptions: Record<string, unknown> | undefined;

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: (props: {
    getHref?: (data: unknown) => string | undefined;
    columnDefs?: ColDef[];
    additionalGridOptions?: Record<string, unknown>;
  }) => {
    capturedGetHref = props.getHref;
    capturedColumns = props.columnDefs;
    capturedGridOptions = props.additionalGridOptions;
    return null;
  },
}));

vi.mock('@/src/constants/grid-columns/grid-columns', () => ({
  ENTITIES_COLUMNS: (columns: unknown[], _remove: unknown, _duplicate: unknown, open?: (entity?: unknown) => void) => {
    capturedOpen = open;
    return columns;
  },
}));

vi.mock('@/src/components/EntityListView/Components/Actions', () => ({
  default: () => null,
}));

vi.mock('@/src/components/EntityListView/HeaderButtons/HeaderButtons', () => ({
  default: () => null,
}));

describe('BaseEntityList — open in new tab', () => {
  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue({ push: vi.fn() } as unknown as ReturnType<typeof useRouter>);
    capturedOpen = undefined;
    capturedGetHref = undefined;
  });

  const renderList = () =>
    render(
      <BaseEntityList
        data={[{ name: 'my-model' }]}
        baseColumns={[]}
        route={ApplicationRoute.Models}
        onRemoveEntity={vi.fn()}
      />,
    );

  test('opens the config-file query param when the row is config-file-sourced', () => {
    const onOpenInNewTabSpy = vi.spyOn(openInNewTabUtils, 'onOpenInNewTab').mockImplementation(() => {});
    renderList();

    capturedOpen?.({ name: 'my-model' });

    expect(onOpenInNewTabSpy).toHaveBeenCalledWith(ApplicationRoute.Models, { name: 'my-model' });
  });

  test('opens the bare route when the row is not config-file-sourced', () => {
    const onOpenInNewTabSpy = vi.spyOn(openInNewTabUtils, 'onOpenInNewTab').mockImplementation(() => {});
    renderList();

    capturedOpen?.({ name: 'my-model' });

    expect(onOpenInNewTabSpy).toHaveBeenCalledWith(ApplicationRoute.Models, { name: 'my-model' });
  });
});

describe('BaseEntityList — rendered row hrefs', () => {
  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue({ push: vi.fn() } as unknown as ReturnType<typeof useRouter>);
    capturedOpen = undefined;
    capturedGetHref = undefined;
  });

  const renderList = (route: ApplicationRoute) =>
    render(<BaseEntityList data={[{ name: 'my-model' }]} baseColumns={[]} route={route} onRemoveEntity={vi.fn()} />);

  test('renders a config-file dual-bucket href with the flag and no path param', () => {
    renderList(ApplicationRoute.AssetsApplications);

    const href = capturedGetHref?.({ name: 'my-app' });

    expect(href).toBe('/assets-applications/my-app');
    expect(href).not.toContain('path=');
  });

  test('renders a config-file toolset href with the flag and no path param', () => {
    renderList(ApplicationRoute.AssetsToolsets);

    expect(capturedGetHref?.({ name: 'my-toolset' })).toBe('/assets-toolsets/my-toolset');
  });

  test('renders the bare href when the row is not config-file-sourced', () => {
    renderList(ApplicationRoute.Models);

    expect(capturedGetHref?.({ name: 'my-model' })).toBe('/models/my-model');
  });
});

describe('BaseEntityList — name link', () => {
  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue({ push: vi.fn() } as unknown as ReturnType<typeof useRouter>);
    capturedColumns = undefined;
    capturedGridOptions = undefined;
  });

  const renderList = (baseColumns: ColDef[], route = ApplicationRoute.Models) =>
    render(
      <BaseEntityList data={[{ name: 'my-model' }]} baseColumns={baseColumns} route={route} onRemoveEntity={vi.fn()} />,
    );

  test('links the display-name column to the row details address', () => {
    renderList([DISPLAY_NAME_COLUMN, { field: 'description' }]);

    const [nameColumn, descriptionColumn] = capturedColumns ?? [];
    expect(nameColumn.cellRenderer).toBe(DisplayNameCellRenderer);
    expect(nameColumn.cellRendererParams.getHref({ name: 'my-model' })).toBe('/models/my-model');
    expect(descriptionColumn.cellRendererParams).toBeUndefined();
  });

  test('renders the App Runners display name through the link renderer', () => {
    renderList([{ field: 'dial:applicationTypeDisplayName' }], ApplicationRoute.ApplicationRunners);

    const [nameColumn] = capturedColumns ?? [];
    expect(nameColumn.cellRenderer).toBe(LinkCellRenderer);
    expect(nameColumn.cellRendererParams.getHref).toBeTypeOf('function');
  });

  test('links the source column to the adapter or container behind it', () => {
    renderList([{ field: 'endpoint' }]);

    const [sourceColumn] = capturedColumns ?? [];
    expect(sourceColumn.cellRenderer).toBe(LinkCellRenderer);
    expect(sourceColumn.cellRendererParams.getHref({ source: { $type: 'adapter', adapterName: 'openai' } })).toBe(
      '/adapters/openai',
    );
  });

  test('does not navigate on a cell click', () => {
    renderList([DISPLAY_NAME_COLUMN]);

    expect(capturedGridOptions?.onCellClicked).toBeUndefined();
  });
});
