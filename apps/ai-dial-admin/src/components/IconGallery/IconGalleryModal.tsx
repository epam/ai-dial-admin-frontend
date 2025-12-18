import { DialFormPopup } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useState } from 'react';

import IconGallery from '@/src/components/IconGallery/IconGallery';
import { ButtonsI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  isModalOpen: boolean;
  selectedValue: string;
  onClose: () => void;
  onChange: (url: string) => void;
}

const IconGalleryModal: FC<Props> = ({ isModalOpen, selectedValue, onClose, onChange }) => {
  const t = useI18n();
  const [selectedIcon, setSelectedIcon] = useState(selectedValue);

  const onApply = useCallback(() => {
    onChange(selectedIcon);
    onClose();
  }, [onChange, onClose, selectedIcon]);

  return (
    <DialFormPopup
      onClose={onClose}
      header={t(EntityFieldsI18nKey.iconUrl)}
      portalId="IconSelector"
      open={isModalOpen}
      onSubmit={onApply}
      onCancel={onClose}
      submitLabel={t(ButtonsI18nKey.Apply)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
    >
      <div className="flex flex-col h-full max-h-[568px] p-6 overflow-y-auto">
        <IconGallery selectedIcon={selectedIcon} setSelectedIcon={setSelectedIcon} />
      </div>
    </DialFormPopup>
  );
};

export default IconGalleryModal;
