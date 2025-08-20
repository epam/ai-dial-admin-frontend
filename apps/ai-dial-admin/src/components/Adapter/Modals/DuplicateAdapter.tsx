import { FC, useCallback, useEffect, useState } from 'react';

import Button from '@/src/components/Common/Button/Button';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import Popup from '@/src/components/Common/Popup/Popup';
import {
  ButtonsI18nKey,
  CreateI18nKey,
  DuplicateI18nKey,
  EntityFieldsI18nKey,
  EntityPlaceholdersI18nKey,
} from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialAdapter } from '@/src/models/dial/adapter';
import { PopUpState } from '@/src/types/pop-up';

interface Props {
  modalState: PopUpState;
  onClose: () => void;
  adapter: DialAdapter;
  onDuplicate: (entity: DialAdapter) => void;
}

const DuplicateAdapter: FC<Props> = ({ onDuplicate, modalState, onClose, adapter }) => {
  const t = useI18n();

  const [entity, setEntity] = useState<DialAdapter>({ ...adapter, name: '' });
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    setIsValid(!!entity.name);
  }, [entity]);

  const onChangeName = useCallback(
    (name: string) => {
      setEntity({ ...entity, name });
    },
    [setEntity, entity],
  );

  const onChangeDisplayName = useCallback(
    (displayName: string) => {
      setEntity({ ...entity, displayName });
    },
    [setEntity, entity],
  );

  const onChangeEndpoint = useCallback(
    (baseEndpoint: string) => {
      setEntity({ ...entity, baseEndpoint });
    },
    [setEntity, entity],
  );

  return (
    <Popup onClose={onClose} heading={t(DuplicateI18nKey.AdapterHeader)} portalId="DuplicateKey" state={modalState}>
      <div className="flex flex-col gap-3 px-6 py-4 ">
        <TextInputField
          placeholder={t(EntityPlaceholdersI18nKey.Id)}
          fieldTitle={t(EntityFieldsI18nKey.id)}
          elementId="name"
          value={entity.name}
          onChange={onChangeName}
        />

        <TextInputField
          fieldTitle={t(EntityFieldsI18nKey.displayName)}
          elementId="displayName"
          placeholder={t(EntityPlaceholdersI18nKey.DisplayName)}
          value={entity.displayName}
          onChange={onChangeDisplayName}
        />

        <TextInputField
          elementId="endpoint"
          placeholder={t(EntityPlaceholdersI18nKey.Endpoint)}
          fieldTitle={t(EntityFieldsI18nKey.baseEndpoint)}
          value={entity.baseEndpoint}
          onChange={onChangeEndpoint}
        />
      </div>
      <div className="flex flex-row justify-end w-full gap-2 px-6 py-4">
        <Button cssClass="secondary" title={t(ButtonsI18nKey.Cancel)} onClick={() => onClose()} />

        <Button
          cssClass="primary"
          title={t(ButtonsI18nKey.Duplicate)}
          disable={!isValid}
          onClick={() => onDuplicate(entity)}
        />
      </div>
    </Popup>
  );
};

export default DuplicateAdapter;
