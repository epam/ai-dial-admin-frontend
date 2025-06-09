import { ColDef, GridOptions, SelectionChangedEvent } from 'ag-grid-community';
import classNames from 'classnames';
import { useState } from 'react';

import Button from '@/src/components/Common/Button/Button';
import NoDataContent from '@/src/components/Common/NoData/NoData';
import Popup from '@/src/components/Common/Popup/Popup';
import Grid from '@/src/components/Grid/Grid';
import { CHECKBOX_COL_DEF } from '@/src/constants/ag-grid';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PopUpState } from '@/src/types/pop-up';

interface Props<T> {
  modalState: PopUpState;
  modalTitle: string;
  emptyTitle: string;
  entities: T[];
  columnDefs?: ColDef[];
  onClose: () => void;
  onApply: (entities: T[]) => void;
}

const defaultColumnDefs: ColDef[] = [
  { headerName: 'Name', field: 'name' },
  { headerName: 'Description', field: 'description' },
];

const AddEntitiesGrid = <T extends object>({
  columnDefs = defaultColumnDefs,
  modalState,
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
    onSelectionChanged: onSelectionChanged,
  };

  const containerClassName = classNames('h-[800px] lg:max-w-[75%] md:max-w-[90%]');
  return (
    <Popup
      onClose={onClose}
      heading={modalTitle}
      portalId="AddEntity"
      state={modalState}
      containerClassName={containerClassName}
    >
      <div className="flex flex-1 flex-col px-6 py-4 min-h-0">
        {!entities.length ? (
          <NoDataContent emptyDataTitle={emptyTitle} />
        ) : (
          <Grid columnDefs={columnDefs} rowData={entities} additionalGridOptions={additionalGridOptions} />
        )}
      </div>
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <Button cssClass="secondary" title={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <Button
          cssClass="primary"
          title={t(ButtonsI18nKey.Apply)}
          onClick={() => onApply(selectedEntities)}
          disable={!selectedEntities.length}
        />
      </div>
    </Popup>
  );
};

export default AddEntitiesGrid;
