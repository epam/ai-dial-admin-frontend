import { FC, useCallback, useState } from 'react';
import { DialFormPopup } from '@epam/ai-dial-ui-kit';

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
    <DialFormPopup
      header={t(EntityFieldsI18nKey.keyValue)}
      portalId="KeyRotateModal"
      open={isModalOpen}
      dividers={true}
      onClose={onClose}
      onSubmit={() => onConfirm(newKey)}
      onCancel={onClose}
      disableSubmitButton={!newKey.key}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      submitLabel={t(ButtonsI18nKey.Rotate)}
    >
      <div className="flex flex-col gap-y-8 px-6 py-4">
        <div className="text-secondary small-150">{t(KeysI18nKey.RotateKeyDescription)}</div>
        <KeyGenerateField keys={keys} selectedKey={newKey} changeKey={onChangeKey} />
        <ValidityPeriod onChange={onChangeExpiresAt} />
      </div>
    </DialFormPopup>
  );
};

export default KeyRotateModal;
