import { FC, useCallback, useState } from 'react';
import { ButtonVariant, DialButton } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import { ButtonsI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import IconGallery from '@/src/components/IconGallery/IconGallery';
import Popup from '@/src/components/Common/Popup/Popup';
import { useI18n } from '@/src/locales/client';
import { PopUpState } from '@/src/types/pop-up';

interface Props {
  modalState: PopUpState;
  selectedValue: string;
  onClose: () => void;
  onChange: (url: string) => void;
}

const IconGalleryModal: FC<Props> = ({ modalState, selectedValue, onClose, onChange }) => {
  const t = useI18n();
  const popupClassNames = classNames('flex flex-col lg:max-w-[808px] md:max-w-[648px] sm:max-w-[328px]');
  const [selectedIcon, setSelectedIcon] = useState(selectedValue);

  const onApply = useCallback(() => {
    onChange(selectedIcon);
    onClose();
  }, [onChange, onClose, selectedIcon]);

  return (
    <Popup
      onClose={onClose}
      heading={t(EntityFieldsI18nKey.iconUrl)}
      portalId="IconSelector"
      state={modalState}
      containerClassName={popupClassNames}
    >
      <div className="flex flex-col max-h-[568px] p-6 overflow-y-scroll">
        <IconGallery selectedIcon={selectedIcon} setSelectedIcon={setSelectedIcon} />
      </div>
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <DialButton variant={ButtonVariant.Secondary} title={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <DialButton variant={ButtonVariant.Primary} title={t(ButtonsI18nKey.Apply)} onClick={onApply} />
      </div>
    </Popup>
  );
};

export default IconGalleryModal;
