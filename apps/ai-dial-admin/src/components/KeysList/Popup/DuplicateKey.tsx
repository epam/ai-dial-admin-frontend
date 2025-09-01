import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import Button from '@/src/components/Common/Button/Button';
import Popup from '@/src/components/Common/Popup/Popup';
import ValidityPeriodInput from '@/src/components/Common/ValidityPeriodInput/ValidityPeriodInput';
import { ButtonsI18nKey, DuplicateI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialKey } from '@/src/models/dial/key';
import { PopUpState } from '@/src/types/pop-up';
import DisplayNameControl from '@/src/components/EntityMainProperties/BaseProperties/DisplayName';
import IdControl from '@/src/components/EntityMainProperties/BaseProperties/Id';
import KeyGenerateField from '../KeyGenerateField';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';

interface Props {
  modalState: PopUpState;
  onClose: () => void;
  entity?: DialKey;
  names: string[];
  keys: string[];
  onDuplicate: (entity: DialKey) => void;
}

const DuplicateKey: FC<Props> = ({ onDuplicate, modalState, onClose, entity, names, keys }) => {
  const t = useI18n() as (t: string) => string;

  const { isValid, dispatch } = useSaveValidationContext();

  const [clonedEntity, setEntity] = useState<DialKey>({
    ...(entity || {}),
    key: '',
    name: '',
    expiresAt: void 0,
  } as DialKey);

  const isValidKey = useMemo(() => {
    return !keys.includes(clonedEntity.key || '');
  }, [clonedEntity.key, keys]);

  const onChangeExpiresAt = useCallback(
    (expiresAt: string) => {
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

  // initial validation (disable save when no values entered yet)
  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'key', isValid: !!clonedEntity.key });
    dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: !!clonedEntity.name });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clonedEntity]);

  return (
    <Popup onClose={onClose} heading={t(DuplicateI18nKey.KeyHeader)} portalId="DuplicateKey" state={modalState}>
      <div className="flex flex-col gap-6 px-6 py-4">
        <IdControl entity={clonedEntity} names={names} onChangeEntity={setEntity} />
        <DisplayNameControl
          displayName={clonedEntity.displayName}
          onChange={(displayName?: string) => setEntity({ ...clonedEntity, displayName })}
        />

        <KeyGenerateField keys={keys} selectedKey={clonedEntity} changeKey={onChangeKey} />
        <ValidityPeriodInput onChange={onChangeExpiresAt} />
      </div>
      <div className="flex flex-row justify-end w-full gap-2 px-6 py-4">
        <Button cssClass="secondary" title={t(ButtonsI18nKey.Cancel)} onClick={() => onClose()} />

        <Button
          cssClass="primary"
          title={t(ButtonsI18nKey.Duplicate)}
          disable={!isValid || !isValidKey}
          onClick={() => onDuplicate(clonedEntity)}
        />
      </div>
    </Popup>
  );
};

export default DuplicateKey;
