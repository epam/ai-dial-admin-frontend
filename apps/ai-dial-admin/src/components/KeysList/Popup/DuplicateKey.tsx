import { FC, useCallback, useEffect, useState } from 'react';

import Button from '@/src/components/Common/Button/Button';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import Popup from '@/src/components/Common/Popup/Popup';
import ValidityPeriodInput from '@/src/components/Common/ValidityPeriodInput/ValidityPeriodInput';
import { isValidKey } from '@/src/components/EntityListView/CreateEntity/validation';
import { ButtonsI18nKey, CreateI18nKey, DuplicateI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialKey } from '@/src/models/dial/key';
import { FieldError } from '@/src/models/error';
import { PopUpState } from '@/src/types/pop-up';
import { getErrorForName } from '@/src/utils/validation/name-error';
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

  const [nameError, setNameError] = useState<FieldError | null>(null);

  useEffect(() => {
    setIsValid(isValidKey(clonedEntity, names) && !keys.includes(clonedEntity.key));
  }, [clonedEntity, keys, names]);

  const onChangeName = useCallback(
    (name: string) => {
      setNameError(getErrorForName(name, names, t));
      setEntity({ ...clonedEntity, name });
    },
    [names, t, clonedEntity],
  );

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
        <TextInputField
          elementId="name"
          fieldTitle={t(CreateI18nKey.NameTitle)}
          placeholder={t(CreateI18nKey.NamePlaceholder)}
          value={clonedEntity.name}
          errorText={nameError?.text}
          invalid={!!nameError}
          onChange={onChangeName}
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
