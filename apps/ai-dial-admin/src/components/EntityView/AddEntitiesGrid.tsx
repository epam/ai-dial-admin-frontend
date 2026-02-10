import { DialFormPopup, PopupSize } from '@epam/ai-dial-ui-kit';
import { ColDef, GridOptions, SelectionChangedEvent } from 'ag-grid-community';
import { useState } from 'react';

import { CHECKBOX_COL_DEF } from '@/src/constants/ag-grid';
import { BASE_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import GridView from '@/src/components/Grid/GridView/GridView';

interface Props<T> {
  isModalOpen: boolean;
  modalTitle: string;
  emptyTitle: string;
  entities: T[];
  columnDefs?: ColDef[];
  onClose: () => void;
  onApply: (entities: T[]) => void;
}

const AddEntitiesGrid = <T extends object>({
  columnDefs = BASE_COLUMNS,
  isModalOpen,
  modalTitle,
  emptyTitle,
  entities,
  onClose,
  onApply,
}: Props<T>) => {
  const t = useI18n();
  const [selectedEntities, setSelectedEntities] = useState<T[]>([]);

  const onSelectionChanged = (event: SelectionChangedEvent) => {
    const selectedRows = event.api.getSelectedRows();
    setSelectedEntities(selectedRows);
  };

  const additionalGridOptions: GridOptions = {
    rowSelection: {
      mode: 'multiRow',
      selectAll: 'all',
    },
    selectionColumnDef: {
      ...CHECKBOX_COL_DEF,
    },
    onSelectionChanged,
  };

  return (
    <DialFormPopup
      onClose={onClose}
      header={modalTitle}
      portalId="AddEntity"
      open={isModalOpen}
      className="h-[800px]"
      size={PopupSize.Lg}
      submitLabel={t(ButtonsI18nKey.Apply)}
      onSubmit={() => onApply(selectedEntities)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      disableSubmitButton={!selectedEntities.length}
      onCancel={onClose}
    >
      <div className="flex h-full flex-col px-6 py-4 min-h-0">
        <GridView
          emptyDataTitle={emptyTitle}
          columnDefs={columnDefs}
          rowData={entities}
          additionalGridOptions={additionalGridOptions}
        />
      </div>
    </DialFormPopup>
  );
};

export default AddEntitiesGrid;
