'use client';
import { FC, useMemo, useState } from 'react';

import { ColDef, GridOptions, SelectionChangedEvent } from 'ag-grid-community';
import classNames from 'classnames';

import Button from '@/src/components/Common/Button/Button';
import NoDataContent from '@/src/components/Common/NoData/NoData';
import Popup from '@/src/components/Common/Popup/Popup';
import { getButtonTitle } from '@/src/components/ExportConfig/AddEntities/utils';
import Grid from '@/src/components/Grid/Grid';
import { CHECKBOX_COL_DEF } from '@/src/constants/ag-grid';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { EntityType } from '@/src/types/entity-type';
import { PopUpState } from '@/src/types/pop-up';
import { getEmptyDataTitleI18nKey } from '@/src/utils/entities/get-empty-data-title';
import Dependencies from './Dependencies';

interface Props {
  modalState: PopUpState;
  selectedTab?: EntityType;
  entities: EntitiesGridData[];
  columnDefs?: ColDef[];
  onClose: () => void;
  onApply: (entities: EntitiesGridData[], dependencies?: EntityType[]) => void;
}

const AddEntitiesModal: FC<Props> = ({ modalState, selectedTab, entities, columnDefs, onClose, onApply }) => {
  const t = useI18n() as (v: string) => string;
  const [selectedEntities, setSelectedEntities] = useState<EntitiesGridData[]>([]);
  const [selectedDependencies, setSelectedDependencies] = useState<EntityType[]>([]);

  const emptyTitle = useMemo(() => {
    return getEmptyDataTitleI18nKey(selectedTab);
  }, [selectedTab]);

  const modalTitle = useMemo(() => {
    return getButtonTitle(t, selectedTab, true);
  }, [selectedTab, t]);

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
      portalId="AddExportEntities"
      state={modalState}
      containerClassName={containerClassName}
    >
      <div className="flex flex-1 flex-col px-6 py-4 min-h-0">
        {!entities.length ? (
          <NoDataContent emptyDataTitle={t(emptyTitle)} />
        ) : (
          <div className="flex-1 flex flex-row min-h-0">
            <div className="flex-1">
              <Grid columnDefs={columnDefs} rowData={entities} additionalGridOptions={additionalGridOptions} />
            </div>
            <Dependencies
              selectedTab={selectedTab}
              selectedDependencies={selectedDependencies}
              onChangeSelectedDependencies={setSelectedDependencies}
            />
          </div>
        )}
      </div>
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <Button cssClass="secondary" title={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <Button
          cssClass="primary"
          title={t(ButtonsI18nKey.Add)}
          onClick={() => onApply(selectedEntities, selectedDependencies)}
          disable={!selectedEntities.length}
        />
      </div>
    </Popup>
  );
};

export default AddEntitiesModal;
