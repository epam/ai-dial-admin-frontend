import { FC, useCallback, useState } from 'react';

import Button from '@/src/components/Common/Button/Button';
import Popup from '@/src/components/Common/Popup/Popup';
import ValidityPeriodInput from '@/src/components/Common/ValidityPeriodInput/ValidityPeriodInput';
import { ButtonsI18nKey, KeysI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialKey } from '@/src/models/dial/key';
import { PopUpState } from '@/src/types/pop-up';
import KeyGenerateField from './KeyGenerateField';

interface Props {
  modalState: PopUpState;
  selectedKey: DialKey;
  keys: string[];
  onConfirm: (key: DialKey) => void;
  onClose: () => void;
}

export const KeyRotateModal: FC<Props> = ({ modalState, selectedKey, keys, onConfirm, onClose }) => {
  const t = useI18n() as (t: string) => string;
  const [newKey, setNewKey] = useState({ ...selectedKey, key: '' });

  const onChangeExpiresAt = useCallback(
    (expiresAt: number) => {
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
      dataTestId="keyRotateModal"
      heading={t(KeysI18nKey.RotateKeyTitle)}
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
        <Button
          cssClass="secondary"
          dataTestId="keyRotateModal-modalCancel"
          title={t(ButtonsI18nKey.Cancel)}
          onClick={() => onClose()}
        />

        <Button
          dataTestId="keyRotateModal-modalConfirm"
          cssClass="primary"
          title={t(ButtonsI18nKey.Rotate)}
          onClick={() => onConfirm(newKey)}
          disable={!newKey.key}
        />
      </div>
    </Popup>
  );
};

export default KeyRotateModal;
