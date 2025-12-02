'use client';
import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { IconPlus } from '@tabler/icons-react';
import { ColDef } from 'ag-grid-community';
import { ButtonVariant, DialButton } from '@epam/ai-dial-ui-kit';

import AddEntitiesModal from '@/src/components/ExportConfig/AddEntities/AddEntitiesModal';
import { getActualColDefs, isEntityWithDependency } from '@/src/components/ExportConfig/utils';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { EntityType } from '@/src/types/entity-type';
import { getAvailableData, getButtonTitle } from './utils';

interface Props {
  selectedTab: EntityType;
  tabData: Record<string, EntitiesGridData[]>;
  customExportData: Record<string, EntitiesGridData[]>;
  setCustomExportData: Dispatch<SetStateAction<Record<string, EntitiesGridData[]>>>;
}

const AddEntitiesButton: FC<Props> = ({ selectedTab, tabData, customExportData, setCustomExportData }) => {
  const t = useI18n() as (v: string) => string;

  const [buttonTitle, setButtonTitle] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableEntities, setAvailableEntities] = useState<EntitiesGridData[]>([]);
  const [entityTitle, setEntityTitle] = useState<EntityType | undefined>(void 0);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);

  const onClick = (id: EntityType) => {
    setEntityTitle(id);
    setAvailableEntities(getAvailableData(id, tabData, customExportData, selectedTab));
    setIsModalOpen(true);
  };

  const onAddEntity = (entities: EntitiesGridData[], dependencies?: EntityType[]) => {
    let data = [...entities];
    if (isEntityWithDependency(selectedTab)) {
      data = data.map((entity) => ({ ...entity, dependencies: dependencies || [] }));
    }
    setCustomExportData((prev) => {
      const existingItems = prev[selectedTab] ?? [];
      return {
        ...prev,
        [selectedTab]: [...existingItems, ...data],
      };
    });
    setIsModalOpen(false);
  };

  useEffect(() => {
    if (selectedTab) {
      setButtonTitle(getButtonTitle(t, selectedTab, true));
      setColumnDefs(getActualColDefs(selectedTab, t).slice(0, -1));
    }
  }, [selectedTab, t]);

  return (
    <>
      <DialButton
        label={buttonTitle}
        iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
        variant={ButtonVariant.Secondary}
        onClick={() => onClick(selectedTab)}
      />

      {isModalOpen &&
        createPortal(
          <AddEntitiesModal
            selectedTab={entityTitle}
            columnDefs={columnDefs}
            isModalOpen={isModalOpen}
            entities={availableEntities}
            onClose={() => setIsModalOpen(false)}
            onApply={onAddEntity}
          />,
          document.body,
        )}
    </>
  );
};

export default AddEntitiesButton;
