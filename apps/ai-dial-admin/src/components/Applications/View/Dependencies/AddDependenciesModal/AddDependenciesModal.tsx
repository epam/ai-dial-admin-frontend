'use client';
import { FC, useState } from 'react';

import { DialFormPopup, PopupSize } from '@epam/ai-dial-ui-kit';
import { GridOptions } from 'ag-grid-community';

import RadioButtonRenderer from '@/src/components/Grid/CellRenderers/RadioButtonRenderer';
import GridView from '@/src/components/Grid/GridView/GridView';
import { SINGLE_ROW_SELECTION } from '@/src/constants/ag-grid';
import { DEPENDENCIES_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { EntityType } from '@/src/types/entity-type';

interface Props {
  isModalOpen: boolean;
  entities: EntitiesGridData[];
  entityType?: EntityType;
  onClose: () => void;
  onApply: (dependencyName: string) => void;
}

const AddDependenciesModal: FC<Props> = ({ isModalOpen, entities, entityType, onClose, onApply }) => {
  const t = useI18n();

  const [selectedEntityName, setSelectedEntityName] = useState<string | undefined>();

  const gridOptions: GridOptions = {
    ...SINGLE_ROW_SELECTION,
    selectionColumnDef: {
      ...SINGLE_ROW_SELECTION.selectionColumnDef,
      cellRenderer: (data: { data?: EntitiesGridData; id: string }) => (
        <RadioButtonRenderer inputId={data.data?.name as string} isChecked={data.data?.name === selectedEntityName} />
      ),
    },
    onRowSelected: (event) => {
      if (event.node.isSelected()) {
        setSelectedEntityName(event.data.name);
      }
    },
  };

  return (
    <DialFormPopup
      onClose={onClose}
      header={t(entityType === EntityType.MODEL ? EntitiesI18nKey.AddModel : EntitiesI18nKey.AddApplication)}
      portalId="AddDependencyEntities"
      open={isModalOpen}
      className="h-[800px]"
      size={PopupSize.Lg}
      submitLabel={t(ButtonsI18nKey.Add)}
      onSubmit={() => onApply(selectedEntityName as string)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      onCancel={onClose}
      disableSubmitButton={!selectedEntityName}
    >
      <div className="flex h-full flex-col px-6 py-4 min-h-0">
        <GridView
          columnDefs={DEPENDENCIES_COLUMNS}
          rowData={entities}
          additionalGridOptions={gridOptions}
          emptyDataTitle={t(
            entityType === EntityType.MODEL ? EntitiesI18nKey.NoModels : EntitiesI18nKey.NoApplications,
          )}
        />
      </div>
    </DialFormPopup>
  );
};

export default AddDependenciesModal;
