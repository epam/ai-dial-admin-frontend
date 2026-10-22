import { FC, useCallback, useState } from 'react';
import { Popup } from '@epam/ai-dial-ui-kit';

import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';

import ValidityPeriod from '@/src/components/Keys/Modals/ValidityPeriod';
import { ButtonsI18nKey, EntityFieldsI18nKey, KeysI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialKey } from '@/src/models/dial/key';
import KeyGenerateField from '@/src/components/Keys/View/Properties/KeyGenerateField';

interface Props {
  isModalOpen: boolean;
  selectedKey: DialKey;
  keys: string[];
  onConfirm: (key: DialKey) => void;
  onClose: () => void;
}

export const KeyRotateModal: FC<Props> = ({ isModalOpen, selectedKey, keys, onConfirm, onClose }) => {
  const t = useI18n();
  const [newKey, setNewKey] = useState({ ...selectedKey, key: '' } as DialKey);

  const onChangeExpiresAt = useCallback(
    (expiresAt: string) => {
      setNewKey({ ...newKey, expiresAt });
    },
    [newKey],
  );

  const onChangeKey = useCallback(
    (key: DialKey) => {
      setNewKey(key);
    },
    [setNewKey],
  );

  return (
    <Popup
      header={t(EntityFieldsI18nKey.keyValue)}
      portalId="KeyRotateModal"
      open={isModalOpen}
      onClose={onClose}
      headerDivider
      footerDivider
      mainButtons={getFormPopupButtons({
        cancelLabel: t(ButtonsI18nKey.Cancel),
        submitLabel: t(ButtonsI18nKey.Rotate),
        isSubmitDisabled: !newKey.key,
        onCancel: onClose,
        onSubmit: () => onConfirm(newKey),
      })}
    >
      <div className="flex flex-col gap-y-8 px-6 py-4">
        <div className="text-secondary dial-small-paragraph-text">{t(KeysI18nKey.RotateKeyDescription)}</div>
        <KeyGenerateField keys={keys} selectedKey={newKey} changeKey={onChangeKey} />
        <ValidityPeriod onChange={onChangeExpiresAt} />
      </div>
    </Popup>
  );
};

export default KeyRotateModal;
