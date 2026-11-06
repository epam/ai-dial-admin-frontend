import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColDef, GridReadyEvent } from 'ag-grid-community';
import { ComponentProps } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ResourceDependenciesI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { ResourceAccess, ResourceDependency } from '@/src/models/dial/resource-dependency';
import DependenciesGrid from '../DependenciesGrid';
import { MAX_DECLARED_DEPENDENCIES } from '../constants';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({ useIsReadOnlyAdmin: vi.fn(() => false) }));

const { updateGridOptions } = vi.hoisted(() => ({ updateGridOptions: vi.fn() }));

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({
    onGridReady,
    emptyDataProps,
    getIsEmptyData,
  }: {
    onGridReady: (event: GridReadyEvent) => void;
    emptyDataProps?: { title: string };
    getIsEmptyData?: () => boolean;
  }) => {
    onGridReady({ api: { updateGridOptions, isDestroyed: () => false } } as unknown as GridReadyEvent);
    return <div>{getIsEmptyData?.() ? emptyDataProps?.title : 'grid'}</div>;
  },
}));

const makeDependency = (linkId: string): ResourceDependency => ({
  kind: 'dial.resourceLink',
  link_id: linkId,
  target: { path: `files/public/${linkId}/` },
  access: [ResourceAccess.Read, ResourceAccess.Write],
  required: true,
});

const lastGridOptions = () => updateGridOptions.mock.calls.at(-1)?.[0] as { columnDefs: ColDef[]; rowData: unknown[] };

describe('DependenciesGrid', () => {
  const user = userEvent.setup();
  const onAdd = vi.fn();
  const onEdit = vi.fn();
  const onDuplicate = vi.fn();
  const onRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useIsReadOnlyAdmin).mockReturnValue(false);
  });

  const renderGrid = (props?: Partial<ComponentProps<typeof DependenciesGrid>>) =>
    render(
      <DependenciesGrid
        dependencies={[makeDependency('a'), makeDependency('b')]}
        onAdd={onAdd}
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onRemove={onRemove}
        {...props}
      />,
    );

  test('shows the live count in the header and hands the rows to the grid', () => {
    renderGrid();

    expect(screen.getByRole('heading', { name: ResourceDependenciesI18nKey.Header })).toBeTruthy();
    expect(lastGridOptions().rowData).toHaveLength(2);
  });

  test('shows the empty state without dependencies', () => {
    renderGrid({ dependencies: [] });

    expect(screen.getByText(ResourceDependenciesI18nKey.NoDependencies)).toBeTruthy();
  });

  test('the Add dependency button calls onAdd', async () => {
    renderGrid();

    await user.click(screen.getByRole('button', { name: ResourceDependenciesI18nKey.AddDependency }));

    expect(onAdd).toHaveBeenCalledOnce();
  });

  test('disables Add dependency at the limit', () => {
    renderGrid({ dependencies: Array.from({ length: MAX_DECLARED_DEPENDENCIES }, (_, i) => makeDependency(`d${i}`)) });

    expect(screen.getByRole('button', { name: ResourceDependenciesI18nKey.AddDependency })).toBeDisabled();
  });

  test('defines the columns in order, with the three row actions last', () => {
    renderGrid();

    expect(lastGridOptions().columnDefs.map((column) => column.colId)).toEqual([
      'link_id',
      'path',
      'access',
      'required',
      'edit',
      'duplicate',
      'remove',
    ]);
  });

  test('keeps declaration order by turning sorting off on every data column', () => {
    renderGrid();

    lastGridOptions()
      .columnDefs.slice(0, 4)
      .forEach((column) => expect(column.sortable).toBe(false));
  });

  test('formats access and required for display', () => {
    renderGrid();

    const [, , access, required] = lastGridOptions().columnDefs;
    const format = (column: ColDef, value: unknown) =>
      (column.valueFormatter as (params: { value: unknown }) => string)({ value });

    expect(format(access, [ResourceAccess.Read, ResourceAccess.Write])).toBe(
      `${ResourceDependenciesI18nKey.Read}, ${ResourceDependenciesI18nKey.Write}`,
    );
    expect(format(required, true)).toBe(ResourceDependenciesI18nKey.Yes);
    expect(format(required, false)).toBe(ResourceDependenciesI18nKey.No);
  });

  test('refreshes the rows when the declaration changes', () => {
    const { rerender } = renderGrid();

    rerender(
      <DependenciesGrid
        dependencies={[makeDependency('a')]}
        onAdd={onAdd}
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onRemove={onRemove}
      />,
    );

    expect(lastGridOptions().rowData).toHaveLength(1);
  });

  test('a read-only admin gets no Add button and no action columns', () => {
    vi.mocked(useIsReadOnlyAdmin).mockReturnValue(true);

    renderGrid();

    expect(screen.queryByRole('button', { name: ResourceDependenciesI18nKey.AddDependency })).toBeNull();
    expect(lastGridOptions().columnDefs.map((column) => column.colId)).toEqual([
      'link_id',
      'path',
      'access',
      'required',
    ]);
  });
});
