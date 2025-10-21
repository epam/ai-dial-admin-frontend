'use client';
import { FC, useState } from 'react';
import { createPortal } from 'react-dom';

import Dropdown from '@/src/components/Common/Dropdown/Dropdown';
import DropdownMenuItem from '@/src/components/Common/Dropdown/DropdownItem';
import { ButtonsI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplication } from '@/src/models/dial/application';
import { DialModel } from '@/src/models/dial/model';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { EntityType } from '@/src/types/entity-type';
import AddDependenciesModal from './AddDependenciesModal';

interface Props {
  availableModels: DialModel[];
  availableApplications: DialApplication[];
  addDependency: (name: string) => void;
}

const AddDependenciesButton: FC<Props> = ({ availableModels, availableApplications, addDependency }) => {
  const t = useI18n() as (v: string) => string;
  const dropdownItems = [
    { id: EntityType.MODEL, name: t(MenuI18nKey.Models) },
    { id: EntityType.APPLICATION, name: t(MenuI18nKey.Applications) },
  ];
  const [entityType, setEntityType] = useState<EntityType>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableEntities, setAvailableEntities] = useState<EntitiesGridData[]>([]);

  const onClick = (type: EntityType) => {
    setEntityType(type);
    setAvailableEntities(type === EntityType.MODEL ? availableModels : availableApplications);
    setIsModalOpen(true);
  };

  const onAddDependency = (dependencyName: string) => {
    addDependency(dependencyName);
    setIsModalOpen(false);
  };

  return (
    <>
      <Dropdown
        listClassName={'w-[140px]'}
        selectedClassName="primary flex items-center font-semibold py-[9px] cursor-pointer"
        selectedValue={{
          id: ButtonsI18nKey.Add,
          name: t(ButtonsI18nKey.Add),
        }}
      >
        {dropdownItems.map((item) => (
          <DropdownMenuItem key={item.name} dropdownItem={item} onClick={() => onClick(item.id)} />
        ))}
      </Dropdown>

      {isModalOpen &&
        createPortal(
          <AddDependenciesModal
            isModalOpen={isModalOpen}
            entities={availableEntities}
            entityType={entityType}
            onClose={() => setIsModalOpen(false)}
            onApply={onAddDependency}
          />,
          document.body,
        )}
    </>
  );
};

export default AddDependenciesButton;
