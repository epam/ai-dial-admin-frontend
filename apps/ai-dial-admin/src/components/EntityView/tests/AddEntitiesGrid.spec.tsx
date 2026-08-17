import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import AddEntitiesGrid from '@/src/components/EntityView/AddEntitiesGrid';
import { DESCRIPTION_COLUMN, DISPLAY_NAME_COLUMN } from '@/src/constants/grid-columns/base-columns';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { ConfigEntityOrigin } from '@/src/types/config-file-entity';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let capturedColumnDefs: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let capturedGridOptions: any;

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ columnDefs, additionalGridOptions }: any) => {
    capturedColumnDefs = columnDefs;
    capturedGridOptions = additionalGridOptions;
    return <section aria-label="grid" />;
  },
}));

const COLUMNS = [DISPLAY_NAME_COLUMN, DESCRIPTION_COLUMN];

const CORE_ROWS = [
  { name: 'interceptors/one', displayName: 'One', origin: ConfigEntityOrigin.Api },
  { name: 'one', displayName: 'One', origin: ConfigEntityOrigin.ConfigFile },
];

const ADMIN_ROWS = [{ name: 'one', displayName: 'One' }];

const renderGrid = (entities: object[], onApply = vi.fn()) => {
  render(
    <AddEntitiesGrid
      isModalOpen
      modalTitle="Add interceptors"
      emptyTitle="No interceptors"
      entities={entities}
      columnDefs={COLUMNS}
      onClose={vi.fn()}
      onApply={onApply}
    />,
  );
  return onApply;
};

const selectRows = (rows: object[]) =>
  act(() => {
    capturedGridOptions.onSelectionChanged({ api: { getSelectedRows: () => rows } });
  });

const getApplyButton = () => screen.getByRole('button', { name: ButtonsI18nKey.Apply });

describe('AddEntitiesGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedColumnDefs = undefined;
    capturedGridOptions = undefined;
  });

  test('keeps the column defs referentially stable across a selection change', () => {
    renderGrid(CORE_ROWS);
    const initialColumnDefs = capturedColumnDefs;

    selectRows([CORE_ROWS[0]]);

    expect(capturedColumnDefs).toBe(initialColumnDefs);
    expect(getApplyButton()).toBeEnabled();
  });

  test('appends the source column only for rows carrying an origin', () => {
    renderGrid(CORE_ROWS);
    expect(capturedColumnDefs).toHaveLength(COLUMNS.length + 1);
    expect(capturedColumnDefs.at(-1)).toMatchObject({ field: 'origin', headerName: 'Source' });
  });

  test('leaves the passed columns untouched for admin-backend rows', () => {
    renderGrid(ADMIN_ROWS);

    expect(capturedColumnDefs).toBe(COLUMNS);
  });

  test('disables Apply until something is selected', () => {
    renderGrid(CORE_ROWS);

    expect(getApplyButton()).toBeDisabled();

    selectRows([CORE_ROWS[1]]);

    expect(getApplyButton()).toBeEnabled();
  });

  test('applies the selected rows', async () => {
    const user = userEvent.setup();
    const onApply = renderGrid(CORE_ROWS);

    selectRows([CORE_ROWS[0], CORE_ROWS[1]]);
    await user.click(getApplyButton());

    expect(onApply).toHaveBeenCalledWith([CORE_ROWS[0], CORE_ROWS[1]]);
  });
});
