'use client';
import { FC, useState } from 'react';
import { createPortal } from 'react-dom';
import { ButtonVariant, DialButtonDropdown, DropdownItem } from '@epam/ai-dial-ui-kit';

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
  const t = useI18n();
  const dropdownItems: DropdownItem[] = [
    { key: EntityType.MODEL, label: t(MenuI18nKey.Models), onClick: () => onClick(EntityType.MODEL) },
    {
      key: EntityType.APPLICATION,
      label: t(MenuI18nKey.Applications),
      onClick: () => onClick(EntityType.APPLICATION),
    },
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
      <DialButtonDropdown label={t(ButtonsI18nKey.Add)} items={dropdownItems} variant={ButtonVariant.Primary} />

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
