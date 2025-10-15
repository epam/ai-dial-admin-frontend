import { FC, useCallback, useState } from 'react';
import { ButtonVariant, DialButton, DialPopup } from '@epam/ai-dial-ui-kit';

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
  const t = useI18n() as (t: string) => string;
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

  const getModalFooter = () => (
    <div className="flex flex-row justify-end w-full gap-2 px-6 py-4">
      <DialButton variant={ButtonVariant.Secondary} title={t(ButtonsI18nKey.Cancel)} onClick={() => onClose()} />

      <DialButton
        variant={ButtonVariant.Primary}
        title={t(ButtonsI18nKey.Rotate)}
        onClick={() => onConfirm(newKey)}
        disable={!newKey.key}
      />
    </div>
  );

  return (
    <DialPopup
      title={t(EntityFieldsI18nKey.keyValue)}
      portalId="KeyRotateModal"
      open={isModalOpen}
      dividers={true}
      onClose={onClose}
      footer={getModalFooter()}
    >
      <div className="flex flex-col gap-6 px-6 py-4">
        <div className="text-secondary small-150">{t(KeysI18nKey.RotateKeyDescription)}</div>
        <KeyGenerateField keys={keys} selectedKey={newKey} changeKey={onChangeKey} />
        <ValidityPeriod onChange={onChangeExpiresAt} />
      </div>
    </DialPopup>
  );
};

export default KeyRotateModal;
