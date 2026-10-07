import { DialCheckbox, DialFormPopup, PopupSize } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useMemo, useState } from 'react';
import { GridOptions } from 'ag-grid-community';

import RadioButtonRenderer from '@/src/components/Grid/CellRenderers/RadioButtonRenderer';
import GridView from '@/src/components/Grid/GridView/GridView';
import { SINGLE_ROW_SELECTION } from '@/src/constants/ag-grid';
import {
  CATALOG_SCHEMA_PICKER_COLUMNS,
  CATALOG_SCHEMA_PICKER_FILTERED_COLUMNS,
} from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { CatalogEntityType, CatalogSchemaOption } from '@/src/models/dial/catalog-schema';
import { filterCatalogSchemaOptionsByEntityType } from '@/src/utils/catalog-schemas/picker-options';

interface Props {
  selectedId?: string;
  options?: CatalogSchemaOption[];
  /** The kind of deployment being edited. Absent leaves every schema listed, as before the filter. */
  entityType?: CatalogEntityType;
  isModalOpen: boolean;
  onClose: () => void;
  onApply: (id?: string) => void;
}

const SelectCatalogSchemaModal: FC<Props> = ({ selectedId, options, entityType, isModalOpen, onClose, onApply }) => {
  const t = useI18n();

  const [selectedSchema, setSelectedSchema] = useState(selectedId);
  /**
   * The escape hatch. Core never checks a deployment's kind against the schema's, so a cross-kind
   * pairing is legal and must stay reachable rather than being refused by this grid.
   */
  const [isShowingAllKinds, setIsShowingAllKinds] = useState(false);

  const isSelectedNode = (data?: CatalogSchemaOption) => !!selectedSchema && data?.$id === selectedSchema;

  /**
   * Whether the grid is actually narrowed to one kind — which is also what makes the kind column a
   * constant. A surface passing no `entityType` is never narrowed, so it keeps the full column set.
   */
  const isFilteredToOneKind = !!entityType && !isShowingAllKinds;

  const rowData = useMemo(() => {
    const all = options || [];
    return isFilteredToOneKind ? filterCatalogSchemaOptionsByEntityType(all, entityType, selectedSchema) : all;
  }, [options, isFilteredToOneKind, entityType, selectedSchema]);

  const columnDefs = useMemo(() => {
    const columns = isFilteredToOneKind ? CATALOG_SCHEMA_PICKER_FILTERED_COLUMNS() : CATALOG_SCHEMA_PICKER_COLUMNS(t);
    return columns.map((col) => ({ ...col, sort: void 0 }));
  }, [isFilteredToOneKind, t]);

  const gridOptions: GridOptions = {
    ...SINGLE_ROW_SELECTION,
    selectionColumnDef: {
      ...SINGLE_ROW_SELECTION.selectionColumnDef,
      cellRenderer: (data: { data?: CatalogSchemaOption; id: string }) => (
        <RadioButtonRenderer inputId={data.data?.$id || data.id} isChecked={isSelectedNode(data.data)} />
      ),
    },
    onRowSelected: (event) => {
      if (event.node.isSelected()) {
        setSelectedSchema((event.data as CatalogSchemaOption)?.$id);
      }
    },
    /**
     * Not `onGridReady`: rows reach this grid through `updateGridOptions` once the api exists, so at
     * ready time the row model is still empty. This also fires again when relaxing the filter
     * replaces the rows, which is when the selected row would otherwise lose its highlight.
     */
    onRowDataUpdated: (event) => {
      event.api.forEachNode((node) => {
        if (isSelectedNode(node.data)) {
          node.setSelected(true);
          event.api.ensureNodeVisible(node, 'middle');
        }
      });
    },
  };

  const onToggleAllKinds = useCallback((value?: boolean) => setIsShowingAllKinds(!!value), []);

  return (
    <DialFormPopup
      onClose={onClose}
      header={t(EntitiesI18nKey.CatalogSchema)}
      portalId="SelectCatalogSchemaModal"
      open={isModalOpen}
      size={PopupSize.Lg}
      className="h-[750px]"
      onSubmit={() => onApply(selectedSchema)}
      disableSubmitButton={!selectedSchema}
      submitLabel={t(ButtonsI18nKey.Apply)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      onCancel={onClose}
    >
      <div className="flex flex-col gap-y-4 px-6 py-4 h-full">
        <div className="flex-1 min-h-0">
          <GridView
            rowData={rowData}
            columnDefs={columnDefs}
            additionalGridOptions={gridOptions}
            // Without this the grid renders as bare headers, which reads as a failed load rather
            // than an empty result — and when the filter is the cause, says nothing about undoing it.
            emptyDataProps={{
              title: isFilteredToOneKind
                ? t(EntitiesI18nKey.NoCatalogSchemasForEntityKind)
                : t(EntitiesI18nKey.NoCatalogSchemas),
            }}
          />
        </div>
        {!!entityType && (
          <DialCheckbox
            id="showAllCatalogEntityKinds"
            label={t(EntitiesI18nKey.ShowAllCatalogEntityKinds)}
            checked={isShowingAllKinds}
            onChange={onToggleAllKinds}
          />
        )}
      </div>
    </DialFormPopup>
  );
};

export default SelectCatalogSchemaModal;
