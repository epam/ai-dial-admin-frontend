'use client';
import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { IconPlus } from '@tabler/icons-react';
import { ColDef } from 'ag-grid-community';

import Button from '@/src/components/Common/Button/Button';
import Dropdown from '@/src/components/Common/Dropdown/Dropdown';
import DropdownMenuItem from '@/src/components/Common/Dropdown/DropdownItem';
import AddEntitiesModal from '@/src/components/ExportConfig/AddEntities/AddEntitiesModal';
import { getActualColDefs, isEntityWithDependency } from '@/src/components/ExportConfig/ExportConfig.utils';
import { MenuI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { PopUpState } from '@/src/types/pop-up';
import { getAvailableData, getButtonTitle } from './AddEntities.utils';
import { EntityType } from '@/src/types/entity-type';

interface Props {
  selectedTab: EntityType;
  tabData: Record<string, EntitiesGridData[]>;
  customExportData: Record<string, EntitiesGridData[]>;
  setCustomExportData: Dispatch<SetStateAction<Record<string, EntitiesGridData[]>>>;
}

const AddEntitiesButton: FC<Props> = ({ selectedTab, tabData, customExportData, setCustomExportData }) => {
  const t = useI18n() as (v: string) => string;
  const dropdownItems = [
    { id: EntityType.MODEL, name: t(MenuI18nKey.Models) },
    { id: EntityType.APPLICATION, name: t(MenuI18nKey.Applications) },
    { id: EntityType.ROUTE, name: t(MenuI18nKey.Routes) },
  ];
  const [buttonTitle, setButtonTitle] = useState('');
  const [modalState, setModalState] = useState(PopUpState.Closed);
  const [availableEntities, setAvailableEntities] = useState<EntitiesGridData[]>([]);
  const [entityTitle, setEntityTitle] = useState<EntityType | undefined>(void 0);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);

  const onClick = (id: EntityType) => {
    setEntityTitle(id);
    setAvailableEntities(getAvailableData(id, tabData, customExportData, selectedTab));
    setModalState(PopUpState.Opened);
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
    setModalState(PopUpState.Closed);
  };

  useEffect(() => {
    if (selectedTab) {
      setButtonTitle(getButtonTitle(t, selectedTab, true));
      setColumnDefs(getActualColDefs(selectedTab, t).slice(0, -1));
    }
  }, [selectedTab, t]);

  return (
    <>
      {selectedTab === EntityType.ENTITIES ? (
        <Dropdown
          selectedClassName="input flex items-center font-semibold py-[9px] cursor-pointer"
          selectedValue={{
            id: EntityType.ENTITIES,
            name: buttonTitle,
          }}
        >
          {dropdownItems.map((item) => (
            <DropdownMenuItem key={item.name} dropdownItem={item} onClick={() => onClick(item.id)} />
          ))}
        </Dropdown>
      ) : (
        <Button
          title={buttonTitle}
          iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
          cssClass="secondary"
          onClick={() => onClick(selectedTab)}
        />
      )}
      {modalState === PopUpState.Opened &&
        createPortal(
          <AddEntitiesModal
            selectedTab={entityTitle}
            columnDefs={columnDefs}
            modalState={modalState}
            entities={availableEntities}
            onClose={() => setModalState(PopUpState.Closed)}
            onApply={onAddEntity}
          />,
          document.body,
        )}
    </>
  );
};

export default AddEntitiesButton;
