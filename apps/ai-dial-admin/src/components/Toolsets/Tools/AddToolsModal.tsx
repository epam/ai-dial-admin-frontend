'use client';

import { ButtonsI18nKey, EntityPlaceholdersI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PopUpState } from '@/src/types/pop-up';
import MultiselectModal from '@/src/components/Common/Multiselect/Modal/MultiselectModal';

interface Props {
  modalState: PopUpState;
  onSelectItems?: (items: string[]) => void;
  onClose: () => void;
}

const AddToolsModal = ({ ...props }: Props) => {
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
