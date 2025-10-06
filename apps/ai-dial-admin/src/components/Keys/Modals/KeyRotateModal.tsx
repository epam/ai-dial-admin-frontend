import { FC, useCallback, useState } from 'react';
import { ButtonVariant, DialButton } from '@epam/ai-dial-ui-kit';

import Popup from '@/src/components/Common/Popup/Popup';
import ValidityPeriodInput from '@/src/components/Common/ValidityPeriodInput/ValidityPeriodInput';
import { ButtonsI18nKey, EntityFieldsI18nKey, KeysI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialKey } from '@/src/models/dial/key';
import { PopUpState } from '@/src/types/pop-up';
import KeyGenerateField from '../View/Properties/KeyGenerateField';

interface Props {
  modalState: PopUpState;
  selectedKey: DialKey;
  keys: string[];
  onConfirm: (key: DialKey) => void;
  onClose: () => void;
}

export const KeyRotateModal: FC<Props> = ({ modalState, selectedKey, keys, onConfirm, onClose }) => {
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

  return (
    <Popup
      heading={t(EntityFieldsI18nKey.keyValue)}
      portalId="KeyRotateModal"
      state={modalState}
      dividers={true}
      onClose={onClose}
    >
      <div className="flex flex-col gap-6 px-6 py-4">
        <div className="text-secondary small-150 ">{t(KeysI18nKey.RotateKeyDescription)}</div>
        <KeyGenerateField keys={keys} selectedKey={newKey} changeKey={onChangeKey} />
        <ValidityPeriodInput onChange={onChangeExpiresAt} />
      </div>

      <div className="flex flex-row justify-end w-full gap-2 px-6 py-4">
        <DialButton variant={ButtonVariant.Secondary} title={t(ButtonsI18nKey.Cancel)} onClick={() => onClose()} />

        <DialButton
          variant={ButtonVariant.Primary}
          title={t(ButtonsI18nKey.Rotate)}
          onClick={() => onConfirm(newKey)}
          disable={!newKey.key}
        />
      </div>
    </Popup>
  );
};

export default KeyRotateModal;
