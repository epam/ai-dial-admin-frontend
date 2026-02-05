'use client';

import { DialFormPopup, PopupSize } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import { useI18n } from '@/src/locales/client';
import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';

interface Props {
  isModalOpen: boolean;
  onClose: () => void;
  onApply: () => void;
}

const ImportFileModal: FC<Props> = ({ isModalOpen, onClose, onApply }) => {
  const t = useI18n();

  return (
    <DialFormPopup
      onClose={onClose}
      open={isModalOpen}
      header={t(TestSuitesI18nKey.ImportFromPC)}
      portalId="ImportFileModal"
      size={PopupSize.Lg}
      onSubmit={onApply}
      onCancel={onClose}
      submitLabel={t(ButtonsI18nKey.Confirm)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
    >
      <div className="flex px-6 py-4 h-full flex-col">
        AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAa
      </div>
    </DialFormPopup>
  );
};

export default ImportFileModal;
