'use client';

import { FC } from 'react';

import SelectEntitiesPopup from '@/src/components/Common/EntitySelectInput/SelectEntitiesPopup';
import { EntitySelectType, PickedEntity } from '@/src/components/Common/EntitySelectInput/models';
import { RolesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Receives the picked applications, each with the source it was picked from. */
  onApply: (entities: PickedEntity[]) => void;
}

/** Multi-select over the applications' Public tree and Platform and config.json grids, for a role's limits. */
const AddApplicationsPopup: FC<Props> = ({ isOpen, onClose, onApply }) => {
  const t = useI18n();

  return (
    <SelectEntitiesPopup
      entityType={EntitySelectType.Application}
      header={t(RolesI18nKey.AddApplications)}
      isOpen={isOpen}
      onClose={onClose}
      onApply={onApply}
    />
  );
};

export default AddApplicationsPopup;
