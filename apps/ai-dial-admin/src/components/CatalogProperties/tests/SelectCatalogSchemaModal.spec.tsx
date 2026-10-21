import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColDef, GridOptions, IRowNode, RowDataUpdatedEvent, RowSelectedEvent } from 'ag-grid-community';
import { ComponentProps } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { EntitiesI18nKey } from '@/src/constants/i18n';
import { CatalogEntityType, CatalogSchemaOption } from '@/src/models/dial/catalog-schema';
import SelectCatalogSchemaModal from '../SelectCatalogSchemaModal';

interface GridViewProps {
  rowData?: CatalogSchemaOption[] | null;
  columnDefs?: ColDef[];
  additionalGridOptions?: GridOptions;
  emptyDataProps?: { title?: string };
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

const kindless: CatalogSchemaOption = {
  $id: 'https://host/kindless-card',
  'dial:catalogEntityType': null,
  'dial:catalogDisplayName': 'Kindless card',
};

/**
 * Stands in for the rows arriving, which is what `onRowDataUpdated` reacts to — not `onGridReady`,
 * where the row model is still empty because rows come through `updateGridOptions`.
 */
const buildRowDataUpdatedEvent = (nodes: CatalogSchemaOption[]) => {
  const selected: CatalogSchemaOption[] = [];
  const event = {
    api: {
      forEachNode: (callback: (node: IRowNode<CatalogSchemaOption>) => void) =>
        nodes.forEach((data) =>
          callback({ data, setSelected: () => selected.push(data) } as unknown as IRowNode<CatalogSchemaOption>),
        ),
      ensureNodeVisible: () => undefined,
    },
  } as unknown as RowDataUpdatedEvent;

  return { event, selected };
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

  test('offers no author or updated-time column', () => {
    renderModal();

    const fields = capturedGridProps?.columnDefs?.map((column) => column.field);
    expect(fields).not.toContain('author');
    expect(fields).not.toContain('updatedAt');
  });

  test('lists every schema it is handed, whichever population it came from', () => {
    renderModal();

    expect(capturedGridProps?.rowData).toEqual([apiWritten, fileDeclared]);
  });

  test('says only that there are none when it is not filtering', () => {
    renderModal({ options: [] });

    expect(capturedGridProps?.emptyDataProps?.title).toEqual(EntitiesI18nKey.NoCatalogSchemas);
  });

  test('replaces a previous selection rather than adding to it', () => {
    renderModal();

    expect(capturedGridProps?.additionalGridOptions?.rowSelection).toEqual(
      expect.objectContaining({ mode: 'singleRow' }),
    );
  });

  test('preselects the schema the deployment already points at, once its rows arrive', () => {
    renderModal({ selectedId: fileDeclared.$id });
    const { event, selected } = buildRowDataUpdatedEvent([apiWritten, fileDeclared]);

    capturedGridProps?.additionalGridOptions?.onRowDataUpdated?.(event);

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

  test('offers the schema id, display name and entity kind as columns with no entity kind given', () => {
    renderModal();

    expect(capturedGridProps?.columnDefs?.map((column) => column.field)).toEqual([
      '$id',
      'dial:catalogDisplayName',
      'dial:catalogEntityType',
    ]);
  });

  test('offers no filter-relaxing control with no entity kind given', () => {
    renderModal();

    expect(screen.queryByRole('checkbox', { name: EntitiesI18nKey.ShowAllCatalogEntityKinds })).toBeNull();
  });
});

describe('SelectCatalogSchemaModal — filtered to an entity kind', () => {
  const renderModal = (props?: Partial<ComponentProps<typeof SelectCatalogSchemaModal>>) =>
    render(
      <SelectCatalogSchemaModal
        options={[apiWritten, fileDeclared, kindless]}
        entityType={CatalogEntityType.Model}
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

  test('lists only the schemas written for that kind, plus those declaring none', () => {
    renderModal();

    expect(capturedGridProps?.rowData).toEqual([apiWritten, kindless]);
  });

  test('names the filter as the reason when it leaves nothing to pick', () => {
    renderModal({ options: [fileDeclared], entityType: CatalogEntityType.Model });

    expect(capturedGridProps?.emptyDataProps?.title).toEqual(EntitiesI18nKey.NoCatalogSchemasForEntityKind);
  });

  test('shows the id alone, the only column that identifies a schema here', () => {
    renderModal();

    expect(capturedGridProps?.columnDefs?.map((column) => column.field)).toEqual(['$id']);
  });

  test('keeps the schema the deployment points at even when its kind differs', () => {
    renderModal({ selectedId: fileDeclared.$id });

    expect(capturedGridProps?.rowData).toEqual([apiWritten, fileDeclared, kindless]);
  });

  test('offers a control that relaxes the filter', () => {
    renderModal();

    expect(screen.getByRole('checkbox', { name: EntitiesI18nKey.ShowAllCatalogEntityKinds })).toBeTruthy();
  });

  /**
   * Re-applying the filter must not hide a pick made while it was relaxed: Apply would still commit
   * that schema, so a grid that dropped it would show nothing selected and commit it anyway.
   */
  test('keeps a cross-kind pick listed after the filter is re-applied', async () => {
    const user = userEvent.setup();
    renderModal();
    const relax = screen.getByRole('checkbox', { name: EntitiesI18nKey.ShowAllCatalogEntityKinds });

    await user.click(relax);
    capturedGridProps?.additionalGridOptions?.onRowSelected?.(buildRowSelectedEvent(fileDeclared));
    await user.click(relax);

    expect(capturedGridProps?.rowData).toEqual([apiWritten, fileDeclared, kindless]);
  });

  test('lists every schema once the filter is relaxed', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('checkbox', { name: EntitiesI18nKey.ShowAllCatalogEntityKinds }));

    expect(capturedGridProps?.rowData).toEqual([apiWritten, fileDeclared, kindless]);
  });

  test('restores the entity-kind column once the filter is relaxed', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('checkbox', { name: EntitiesI18nKey.ShowAllCatalogEntityKinds }));

    expect(capturedGridProps?.columnDefs?.map((column) => column.field)).toEqual([
      '$id',
      'dial:catalogDisplayName',
      'dial:catalogEntityType',
    ]);
  });

  test('applies a cross-kind schema reached through the relaxed filter', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    renderModal({ onApply });

    await user.click(screen.getByRole('checkbox', { name: EntitiesI18nKey.ShowAllCatalogEntityKinds }));
    capturedGridProps?.additionalGridOptions?.onRowSelected?.(buildRowSelectedEvent(fileDeclared));
    await user.click(screen.getByRole('button', { name: 'Buttons.Apply' }));

    expect(onApply).toHaveBeenCalledWith(fileDeclared.$id);
  });
});
