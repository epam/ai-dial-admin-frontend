'use client';
import { FC, useMemo, useState } from 'react';

import { Popup, NoDataContent, PopupSize } from '@epam/ai-dial-ui-kit';

import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';
import { ColDef, GridOptions, SelectionChangedEvent } from 'ag-grid-community';

import { getButtonTitle } from '@/src/components/ExportConfig/AddEntities/utils';
import GridView from '@/src/components/Grid/GridView/GridView';
import { MULTI_ROW_SELECTION } from '@/src/constants/ag-grid';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { EntityType } from '@/src/types/entity-type';
import { ExportFormat } from '@/src/types/export';
import { getEmptyDataTitleI18nKey } from '@/src/utils/entities/get-empty-data-title';
import Dependencies from './Dependencies';

interface Props {
  isModalOpen: boolean;
  selectedTab?: EntityType;
  entities: EntitiesGridData[];
  columnDefs?: ColDef[];
  selectedExportFormat: ExportFormat;
  onClose: () => void;
  onApply: (entities: EntitiesGridData[], dependencies?: EntityType[]) => void;
  disabledDependencies?: boolean;
}

const AddEntitiesModal: FC<Props> = ({
  isModalOpen,
  selectedExportFormat,
  selectedTab,
  entities,
  columnDefs,
  onClose,
  onApply,
  disabledDependencies,
}) => {
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
    <Popup
      onClose={onClose}
      header={modalTitle}
      portalId="AddExportEntities"
      open={isModalOpen}
      size={PopupSize.Lg}
      className="md:h-[800px]"
      mainButtons={getFormPopupButtons({
        cancelLabel: t(ButtonsI18nKey.Cancel),
        submitLabel: t(ButtonsI18nKey.Add),
        isSubmitDisabled: !selectedEntities.length,
        onCancel: onClose,
        onSubmit: () => onApply(selectedEntities, selectedDependencies),
      })}
    >
      <div className="flex h-full flex-col px-6 py-4 min-h-0">
        {!entities.length ? (
          <NoDataContent title={t(emptyTitle)} />
        ) : (
          <div className="flex-1 flex flex-row min-h-0">
            <div className="flex-1">
              <GridView columnDefs={columnDefs} rowData={entities} additionalGridOptions={additionalGridOptions} />
            </div>
            <Dependencies
              selectedTab={selectedTab}
              selectedExportFormat={selectedExportFormat}
              selectedDependencies={selectedDependencies}
              onChangeSelectedDependencies={setSelectedDependencies}
              disabled={disabledDependencies}
            />
          </div>
        )}
      </div>
    </Popup>
  );
};

export default AddEntitiesModal;
