'use client';

import { FC } from 'react';

import { ButtonsI18nKey, EntityPlaceholdersI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import MultiselectModal from '@/src/components/Common/Multiselect/Modal/MultiselectModal';

interface Props {
  isModalOpen: boolean;
  onSelectItems?: (items: string[]) => void;
  onClose: () => void;
}

const AddToolsModal: FC<Props> = ({ ...props }) => {
  const t = useI18n();

  return (
    <MultiselectModal
      addPlaceholder={t(EntityPlaceholdersI18nKey.ToolName)}
      heading={t(ToolsetI18nKey.AddTools)}
      addTitle={t(ButtonsI18nKey.Add)}
      applyButtonText={t(ButtonsI18nKey.Add)}
      {...props}
    />
  );
};

export default AddToolsModal;
