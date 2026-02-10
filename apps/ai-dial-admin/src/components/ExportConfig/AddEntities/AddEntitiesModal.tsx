'use client';
import { FC, useMemo, useState } from 'react';

import { DialFormPopup, DialNoDataContent, PopupSize } from '@epam/ai-dial-ui-kit';
import { ColDef, GridOptions, SelectionChangedEvent } from 'ag-grid-community';

import { getButtonTitle } from '@/src/components/ExportConfig/AddEntities/utils';
import AgGridWrapper from '@/src/components/Grid/AgGridWrapper';
import { MULTI_ROW_SELECTION } from '@/src/constants/ag-grid';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { EntityType } from '@/src/types/entity-type';
import { getEmptyDataTitleI18nKey } from '@/src/utils/entities/get-empty-data-title';
import Dependencies from './Dependencies';

interface Props {
  isModalOpen: boolean;
  selectedTab?: EntityType;
  entities: EntitiesGridData[];
  columnDefs?: ColDef[];
  onClose: () => void;
  onApply: (entities: EntitiesGridData[], dependencies?: EntityType[]) => void;
}

const AddEntitiesModal: FC<Props> = ({ isModalOpen, selectedTab, entities, columnDefs, onClose, onApply }) => {
  const t = useI18n();
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
    ...MULTI_ROW_SELECTION,
    onSelectionChanged,
  };

  return (
    <DialFormPopup
      onClose={onClose}
      header={modalTitle}
      portalId="AddExportEntities"
      open={isModalOpen}
      size={PopupSize.Lg}
      className="h-[800px]"
      onSubmit={() => onApply(selectedEntities, selectedDependencies)}
      onCancel={onClose}
      disableSubmitButton={!selectedEntities.length}
      submitLabel={t(ButtonsI18nKey.Add)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
    >
      <div className="flex h-full flex-col px-6 py-4 min-h-0">
        {!entities.length ? (
          <DialNoDataContent title={t(emptyTitle)} />
        ) : (
          <div className="flex-1 flex flex-row min-h-0">
            <div className="flex-1">
              <AgGridWrapper columnDefs={columnDefs} rowData={entities} additionalGridOptions={additionalGridOptions} />
            </div>
            <Dependencies
              selectedTab={selectedTab}
              selectedDependencies={selectedDependencies}
              onChangeSelectedDependencies={setSelectedDependencies}
            />
          </div>
        )}
      </div>
    </DialFormPopup>
  );
};

export default AddEntitiesModal;
