import { Popup, PopupSize } from '@epam/ai-dial-ui-kit';

import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';
import { ColDef, GridOptions, SelectionChangedEvent } from 'ag-grid-community';
import { useMemo, useState } from 'react';

import GridView from '@/src/components/Grid/GridView/GridView';
import { MULTI_ROW_SELECTION } from '@/src/constants/ag-grid';
import { BASE_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { withSourceColumn } from '@/src/utils/config-entities/source-column';

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
  // A fresh column array on a selection-only re-render re-pushes `rowData` through ag-grid's grid
  // options, which rebuilds every row node and clears the selection that just happened.
  const columns = useMemo(() => withSourceColumn(columnDefs, entities), [columnDefs, entities]);

  const onSelectionChanged = (event: SelectionChangedEvent) => {
    const selectedRows = event.api.getSelectedRows();
    setSelectedEntities(selectedRows);
  };

  const additionalGridOptions: GridOptions = {
    ...MULTI_ROW_SELECTION,
    onSelectionChanged,
  };

  return (
    <Popup
      onClose={onClose}
      header={modalTitle}
      portalId="AddEntity"
      open={isModalOpen}
      className="h-[800px]"
      size={PopupSize.Lg}
      mainButtons={getFormPopupButtons({
        cancelLabel: t(ButtonsI18nKey.Cancel),
        submitLabel: t(ButtonsI18nKey.Apply),
        isSubmitDisabled: !selectedEntities.length,
        onCancel: onClose,
        onSubmit: () => onApply(selectedEntities),
      })}
    >
      <div className="flex h-full flex-col px-6 py-4 min-h-0">
        <GridView
          emptyDataProps={{ title: emptyTitle }}
          columnDefs={columns}
          rowData={entities}
          additionalGridOptions={additionalGridOptions}
        />
      </div>
    </Popup>
  );
};

export default AddEntitiesGrid;
