'use client';

import { FC, useEffect, useState } from 'react';

import { DialConfirmationPopup, DialInput, PopupSize } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, EntityFieldsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  isOpen: boolean;
  initialName: string;
  onClose: () => void;
  onConfirm: (name: string) => void;
}

const RenameRequestModal: FC<Props> = ({ isOpen, initialName, onClose, onConfirm }) => {
  const t = useI18n();
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
    }
  }, [isOpen, initialName]);

  return (
    <DialConfirmationPopup
      portalId="RenameRequestModal"
      header={t(TestSuitesI18nKey.RenameRequest)}
      open={isOpen}
      onClose={onClose}
      confirmLabel={t(ButtonsI18nKey.Confirm)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      onConfirm={() => onConfirm(name.trim())}
      disableConfirmButton={!name.trim()}
      size={PopupSize.Md}
    >
      <div className="flex flex-col gap-4 px-6 py-4">
        <DialInput
          id="rename-request-name"
          labelProps={{ label: t(EntityFieldsI18nKey.name) }}
          value={name}
          onChange={(value) => setName(value ?? '')}
        />
      </div>
    </DialConfirmationPopup>
  );
};

export default RenameRequestModal;
