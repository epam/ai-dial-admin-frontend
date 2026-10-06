import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ActionMenuOperationI18nKey, ButtonsI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { DialRoleResource } from '@/src/models/dial/resource';
import { ConfigEntityOrigin } from '@/src/types/config-file-entity';
import RoleEntities from '../Entities';
import { PlatformRoleModelLimitRow, PlatformRoleModelOption } from '../models';

const gridState = vi.hoisted(() => {
  const gridOptions: Record<string, unknown>[] = [];
  const api = {
    isDestroyed: vi.fn(() => false),
    updateGridOptions: vi.fn((options: Record<string, unknown>) => gridOptions.push(options)),
  };

  return { api, gridOptions, isReadOnly: false };
});

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: () => gridState.isReadOnly,
}));

vi.mock('@/src/components/EntityView/AddEntitiesGrid', () => ({
  default: ({
    entities,
    onApply,
  }: {
    entities: PlatformRoleModelOption[];
    onApply: (models: PlatformRoleModelOption[]) => void;
  }) => (
    <section aria-label="add models">
      <button type="button" onClick={() => onApply(entities)}>
        Apply models
      </button>
    </section>
  ),
}));

vi.mock('@/src/components/Grid/GridView/GridView', async () => {
  const React = await import('react');

  return {
    default: ({ onGridReady }: { onGridReady?: (event: { api: typeof gridState.api }) => void }) => {
      React.useEffect(() => {
        onGridReady?.({ api: gridState.api });
      }, []);

      return React.createElement('div', { role: 'grid' });
    },
  };
});

const models: PlatformRoleModelOption[] = [
  { name: 'modelA', displayName: 'modelA', origin: ConfigEntityOrigin.Api },
  { name: 'modelB', displayName: 'modelB', origin: ConfigEntityOrigin.ConfigFile },
];

const role = (limits: DialRoleResource['limits'] = {}): DialRoleResource => ({
  name: 'role',
  limits,
});

describe('RoleEntities', () => {
  beforeEach(() => {
    gridState.isReadOnly = false;
    gridState.gridOptions.length = 0;
    gridState.api.isDestroyed.mockClear();
    gridState.api.updateGridOptions.mockClear();
  });

  test('shows the attached-model count and adds every model selected in the popup', async () => {
    const user = userEvent.setup();
    const onChangeRole = vi.fn();

    render(
      <RoleEntities selectedRole={role({ existing: {} })} models={models} isSkipRefresh onChangeRole={onChangeRole} />,
    );

    expect(screen.getByText(`${TabsI18nKey.Entities}: 1`)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Add }));

    expect(screen.getByRole('region', { name: 'add models' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Apply models' }));

    expect(onChangeRole).toHaveBeenCalledWith(
      expect.objectContaining({
        limits: {
          existing: {},
          modelA: {},
          modelB: {},
        },
      }),
    );
  });

  test('does not offer add or remove controls to a read-only admin', () => {
    gridState.isReadOnly = true;

    render(<RoleEntities selectedRole={role({ modelA: {} })} models={models} isSkipRefresh onChangeRole={vi.fn()} />);

    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Add })).toBeNull();
    const initialGridOptions = gridState.gridOptions.find((options) => 'rowData' in options);
    expect(
      (initialGridOptions?.columnDefs as { field?: string }[]).some((column) => column.field === 'actionsColumn'),
    ).toBe(false);
  });

  test('renders triangle-free token cells and clears a model limits without removing it', async () => {
    const onChangeRole = vi.fn();
    render(
      <RoleEntities
        selectedRole={role({ modelA: { minute: 10, day: 20 }, modelB: { week: 30 } })}
        models={models}
        isSkipRefresh
        onChangeRole={onChangeRole}
      />,
    );

    await waitFor(() => {
      expect(gridState.gridOptions.some((options) => 'rowData' in options)).toBe(true);
    });

    const initialGridOptions = gridState.gridOptions.find((options) => 'rowData' in options) as {
      columnDefs: Array<{
        field?: string;
        cellRendererParams?: {
          hideTriangle?: boolean;
          items?: Array<{ id: ActionMenuOperationI18nKey; onClick: (entity?: PlatformRoleModelLimitRow) => void }>;
        };
      }>;
      rowData: PlatformRoleModelLimitRow[];
    };
    const tokenFields = ['minute', 'day', 'week', 'month'];
    const tokenColumns = initialGridOptions.columnDefs.filter((column) => tokenFields.includes(column.field ?? ''));
    const actionColumn = initialGridOptions.columnDefs.find((column) => column.field === 'actionsColumn');
    const actions = actionColumn?.cellRendererParams?.items;

    expect(tokenColumns).toHaveLength(4);
    expect(tokenColumns.every((column) => column.cellRendererParams?.hideTriangle)).toBe(true);
    expect(actions?.map((action) => action.id)).toEqual([
      ActionMenuOperationI18nKey.Set_no_limits,
      ActionMenuOperationI18nKey.Remove,
    ]);

    actions?.[0].onClick(initialGridOptions.rowData[0]);

    expect(onChangeRole).toHaveBeenCalledOnce();
    expect(onChangeRole).toHaveBeenCalledWith(
      expect.objectContaining({
        limits: {
          modelA: {},
          modelB: { week: 30 },
        },
      }),
    );
  });

  test('updates one row in place and keeps the grid data stable for the next row edit', async () => {
    const onChangeRole = vi.fn();
    const initialRole = role({ modelA: { minute: 10 }, modelB: { week: 20 } });
    const { rerender } = render(
      <RoleEntities selectedRole={initialRole} models={models} isSkipRefresh onChangeRole={onChangeRole} />,
    );

    await waitFor(() => {
      expect(gridState.gridOptions.some((options) => 'rowData' in options)).toBe(true);
    });

    const initialGridOptions = gridState.gridOptions.find((options) => 'rowData' in options) as {
      columnDefs: { field?: string; cellRendererParams?: { onChange?: (value: string, data: unknown) => void } }[];
      rowData: Array<Record<string, unknown>>;
    };
    const dayColumn = initialGridOptions.columnDefs.find((column) => column.field === 'day');

    dayColumn?.cellRendererParams?.onChange?.('0', initialGridOptions.rowData[0]);

    expect(initialGridOptions.rowData).toEqual([
      { name: 'modelA', minute: 10, day: 0 },
      { name: 'modelB', week: 20 },
    ]);
    expect(onChangeRole).toHaveBeenCalledWith(
      expect.objectContaining({ limits: { modelA: { minute: 10, day: 0 }, modelB: { week: 20 } } }),
      true,
    );

    gridState.gridOptions.length = 0;
    rerender(
      <RoleEntities
        selectedRole={role({ modelA: { minute: 10, day: 0 }, modelB: { week: 20 } })}
        models={models}
        isSkipRefresh
        onChangeRole={onChangeRole}
      />,
    );

    expect(gridState.gridOptions.some((options) => 'rowData' in options)).toBe(false);
  });
});
