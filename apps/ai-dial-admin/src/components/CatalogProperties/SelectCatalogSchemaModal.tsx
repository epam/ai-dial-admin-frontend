import { DialFormPopup, PopupSize } from '@epam/ai-dial-ui-kit';
import { FC, useState } from 'react';
import { GridOptions, GridReadyEvent } from 'ag-grid-community';

import RadioButtonRenderer from '@/src/components/Grid/CellRenderers/RadioButtonRenderer';
import GridView from '@/src/components/Grid/GridView/GridView';
import { SINGLE_ROW_SELECTION } from '@/src/constants/ag-grid';
import { CATALOG_SCHEMA_PICKER_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { CatalogSchemaOption } from '@/src/models/dial/catalog-schema';

interface Props {
  selectedId?: string;
  options?: CatalogSchemaOption[];
  isModalOpen: boolean;
  onClose: () => void;
  onApply: (id?: string) => void;
}

const SelectCatalogSchemaModal: FC<Props> = ({ selectedId, options, isModalOpen, onClose, onApply }) => {
  const t = useI18n();

  const [selectedSchema, setSelectedSchema] = useState(selectedId);

  const isSelectedNode = (data?: CatalogSchemaOption) => !!selectedSchema && data?.$id === selectedSchema;

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
  };

  const onGridReady = (event: GridReadyEvent) => {
    event.api?.updateGridOptions({ rowData: [...(options || [])] });
    event.api.forEachNode((node) => {
      if (isSelectedNode(node.data)) {
        node.setSelected(true);
      }
    });
  };

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
      <div className="flex flex-col px-6 py-4 h-full">
        <GridView
          columnDefs={CATALOG_SCHEMA_PICKER_COLUMNS(t).map((col) => ({ ...col, sort: void 0 }))}
          additionalGridOptions={gridOptions}
          onGridReady={onGridReady}
        />
      </div>
    </DialFormPopup>
  );
};

export default SelectCatalogSchemaModal;
