import { FC, useCallback, useEffect, useState } from 'react';

import Button from '@/src/components/Common/Button/Button';
import Popup from '@/src/components/Common/Popup/Popup';
import ValidityPeriodInput from '@/src/components/Common/ValidityPeriodInput/ValidityPeriodInput';
import { ButtonsI18nKey, DuplicateI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialKey } from '@/src/models/dial/key';
import { PopUpState } from '@/src/types/pop-up';
import { isValidKey } from '@/src/utils/validation/is-valid-key';
import DisplayNameControl from '@/src/components/EntityMainProperties/BaseProperties/DisplayName';
import IdControl from '@/src/components/EntityMainProperties/BaseProperties/Id';
import KeyGenerateField from '../KeyGenerateField';

interface Props {
  modalState: PopUpState;
  onClose: () => void;
  entity: DialKey;
  names: string[];
  keys: string[];
  onDuplicate: (entity: DialKey) => void;
}

const DuplicateKey: FC<Props> = ({ onDuplicate, modalState, onClose, entity, names, keys }) => {
  const t = useI18n() as (t: string) => string;

  const [clonedEntity, setEntity] = useState<DialKey>({ ...entity, key: '', name: '', expiresAt: void 0 });
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    setIsValid(isValidKey(clonedEntity, names) && !keys.includes(clonedEntity.key));
  }, [clonedEntity, keys, names]);

  const onChangeExpiresAt = useCallback(
    (expiresAt: number) => {
      setEntity({ ...clonedEntity, expiresAt });
    },
    [clonedEntity],
  );

  const onChangeKey = useCallback(
    (key: DialKey) => {
      setEntity(key);
    },
    [setEntity],
  );

  return (
    <Popup onClose={onClose} heading={t(DuplicateI18nKey.KeyHeader)} portalId="DuplicateKey" state={modalState}>
      <div className="flex flex-col gap-4 px-6 py-4">
        <IdControl entity={clonedEntity} onChangeEntity={setEntity} />
        <DisplayNameControl
          displayName={clonedEntity.displayName}
          onChange={(displayName: string) => setEntity({ ...clonedEntity, displayName })}
        />

        <KeyGenerateField keys={keys} selectedKey={clonedEntity} changeKey={onChangeKey} />
        <ValidityPeriodInput onChange={onChangeExpiresAt} />
      </div>
      <div className="flex flex-row justify-end w-full gap-2 px-6 py-4">
        <Button cssClass="secondary" title={t(ButtonsI18nKey.Cancel)} onClick={() => onClose()} />

        <Button
          cssClass="primary"
          title={t(ButtonsI18nKey.Duplicate)}
          disable={!isValid}
          onClick={() => onDuplicate(clonedEntity)}
        />
      </div>
    </Popup>
  );
};

export default DuplicateKey;
