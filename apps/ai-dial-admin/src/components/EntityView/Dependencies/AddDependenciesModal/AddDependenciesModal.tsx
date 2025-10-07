'use client';
import { FC, useState } from 'react';

import { ButtonVariant, DialButton, DialNoDataContent } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import Popup from '@/src/components/Common/Popup/Popup';
import RadioButtonRenderer from '@/src/components/Grid/CellRenderers/RadioButtonRenderer';
import Grid from '@/src/components/Grid/Grid';
import { RADIO_BUTTON_COL_DEF } from '@/src/constants/ag-grid';
import { DEPENDENCIES_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { EntityType } from '@/src/types/entity-type';
import { PopUpState } from '@/src/types/pop-up';

interface Props {
  modalState: PopUpState;
  entities: EntitiesGridData[];
  entityType?: EntityType;
  onClose: () => void;
  onApply: (dependencyName: string) => void;
}

const AddDependenciesModal: FC<Props> = ({ modalState, entities, entityType, onClose, onApply }) => {
  const t = useI18n() as (v: string) => string;

  const [selectedEntityName, setSelectedEntityName] = useState<string | undefined>();
  const containerClassName = classNames('h-[800px] lg:max-w-[75%] md:max-w-[90%]');

  return (
    <Popup
      onClose={onClose}
      heading={t(entityType === EntityType.MODEL ? EntitiesI18nKey.AddModel : EntitiesI18nKey.AddApplication)}
      portalId="AddDependencyEntities"
      state={modalState}
      containerClassName={containerClassName}
    >
      <div className="flex flex-1 flex-col px-6 py-4 min-h-0">
        {!entities.length ? (
          <DialNoDataContent
            title={t(entityType === EntityType.MODEL ? EntitiesI18nKey.NoModels : EntitiesI18nKey.NoApplications)}
          />
        ) : (
          <div className="flex-1 flex flex-col min-h-0 w-full">
            <Grid
              columnDefs={DEPENDENCIES_COLUMNS}
              rowData={entities}
              additionalGridOptions={{
                rowSelection: { mode: 'singleRow', enableClickSelection: true },
                selectionColumnDef: {
                  ...RADIO_BUTTON_COL_DEF,
                  cellRenderer: (data: { data?: EntitiesGridData; id: string }) => (
                    <RadioButtonRenderer
                      inputId={data.data?.name as string}
                      isChecked={data.data?.name === selectedEntityName}
                    />
                  ),
                },
                onRowSelected: (event) => {
                  if (event.node.isSelected()) {
                    setSelectedEntityName(event.data.name);
                  }
                },
              }}
            />
          </div>
        )}
      </div>
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <DialButton variant={ButtonVariant.Secondary} title={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <DialButton
          variant={ButtonVariant.Primary}
          title={t(ButtonsI18nKey.Add)}
          onClick={() => onApply(selectedEntityName as string)}
          disable={!selectedEntityName}
        />
      </div>
    </Popup>
  );
};

export default AddDependenciesModal;
