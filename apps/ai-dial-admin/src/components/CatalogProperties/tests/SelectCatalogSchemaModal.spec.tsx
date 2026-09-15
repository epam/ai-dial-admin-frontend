import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColDef, GridOptions, GridReadyEvent, IRowNode, RowSelectedEvent } from 'ag-grid-community';
import { ComponentProps } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { CatalogEntityType, CatalogSchemaOption } from '@/src/models/dial/catalog-schema';
import SelectCatalogSchemaModal from '../SelectCatalogSchemaModal';

interface GridViewProps {
  columnDefs?: ColDef[];
  additionalGridOptions?: GridOptions;
  onGridReady?: (event: GridReadyEvent) => void;
}

let capturedGridProps: GridViewProps | undefined;

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: (props: GridViewProps) => {
    capturedGridProps = props;
    return <section aria-label="catalog-schema-grid" />;
  },
}));

const apiWritten: CatalogSchemaOption = {
  $id: 'https://host/model-card',
  'dial:catalogEntityType': CatalogEntityType.Model,
  'dial:catalogDisplayName': 'Model card',
};

const fileDeclared: CatalogSchemaOption = {
  $id: 'https://host/agent-card',
  'dial:catalogEntityType': CatalogEntityType.Agent,
  'dial:catalogDisplayName': 'Agent card',
};

const buildGridReadyEvent = (nodes: CatalogSchemaOption[]) => {
  const updateGridOptions = vi.fn();
  const selected: CatalogSchemaOption[] = [];
  const event = {
    api: {
      updateGridOptions,
      forEachNode: (callback: (node: IRowNode<CatalogSchemaOption>) => void) =>
        nodes.forEach((data) =>
          callback({ data, setSelected: () => selected.push(data) } as unknown as IRowNode<CatalogSchemaOption>),
        ),
    },
  } as unknown as GridReadyEvent;

  return { event, updateGridOptions, selected };
};

const buildRowSelectedEvent = (option: CatalogSchemaOption) =>
  ({
    node: { isSelected: () => true } as IRowNode<CatalogSchemaOption>,
    data: option,
  }) as unknown as RowSelectedEvent<CatalogSchemaOption>;

describe('SelectCatalogSchemaModal', () => {
  const renderModal = (props?: Partial<ComponentProps<typeof SelectCatalogSchemaModal>>) =>
    render(
      <SelectCatalogSchemaModal
        options={[apiWritten, fileDeclared]}
        isModalOpen
        onClose={vi.fn()}
        onApply={vi.fn()}
        {...props}
      />,
    );

  beforeEach(() => {
    capturedGridProps = undefined;
    vi.clearAllMocks();
  });

  test('renders the selection grid', () => {
    renderModal();

    expect(screen.getByRole('region', { name: 'catalog-schema-grid' })).toBeTruthy();
  });

  test('offers exactly the schema id, display name and entity kind as columns', () => {
    renderModal();

    expect(capturedGridProps?.columnDefs?.map((column) => column.field)).toEqual([
      '$id',
      'dial:catalogDisplayName',
      'dial:catalogEntityType',
    ]);
  });

  test('offers no author or updated-time column', () => {
    renderModal();

    const fields = capturedGridProps?.columnDefs?.map((column) => column.field);
    expect(fields).not.toContain('author');
    expect(fields).not.toContain('updatedAt');
  });

  test('lists every schema it is handed, whichever population it came from', () => {
    renderModal();
    const { event, updateGridOptions } = buildGridReadyEvent([]);

    capturedGridProps?.onGridReady?.(event);

    expect(updateGridOptions).toHaveBeenCalledWith({ rowData: [apiWritten, fileDeclared] });
  });

  test('replaces a previous selection rather than adding to it', () => {
    renderModal();

    expect(capturedGridProps?.additionalGridOptions?.rowSelection).toEqual(
      expect.objectContaining({ mode: 'singleRow' }),
    );
  });

  test('preselects the schema the deployment already points at', () => {
    renderModal({ selectedId: fileDeclared.$id });
    const { event, selected } = buildGridReadyEvent([apiWritten, fileDeclared]);

    capturedGridProps?.onGridReady?.(event);

    expect(selected).toEqual([fileDeclared]);
  });

  test('applies a schema written for another entity kind', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    renderModal({ onApply });

    capturedGridProps?.additionalGridOptions?.onRowSelected?.(buildRowSelectedEvent(fileDeclared));
    await user.click(screen.getByRole('button', { name: 'Buttons.Apply' }));

    expect(onApply).toHaveBeenCalledWith(fileDeclared.$id);
  });

  test('cannot be applied before a schema is picked', () => {
    renderModal();

    expect(screen.getByRole('button', { name: 'Buttons.Apply' }).getAttribute('disabled')).not.toBeNull();
  });
});
