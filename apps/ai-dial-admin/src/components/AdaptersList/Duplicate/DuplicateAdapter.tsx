import { FC, useCallback, useEffect, useState } from 'react';

import Button from '@/src/components/Common/Button/Button';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import Popup from '@/src/components/Common/Popup/Popup';
import { ButtonsI18nKey, CreateI18nKey, DuplicateI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
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
          fieldTitle={t(CreateI18nKey.NameTitle)}
          elementId="name"
          placeholder={t(CreateI18nKey.NamePlaceholder)}
          value={entity.name}
          onChange={onChangeName}
        />

        <TextInputField
          fieldTitle={t(CreateI18nKey.DisplayNameTitle)}
          elementId="displayName"
          placeholder={t(CreateI18nKey.DisplayNamePlaceholder)}
          value={entity.displayName}
          onChange={onChangeDisplayName}
        />

        <TextInputField
          elementId="endpoint"
          placeholder={t(EntitiesI18nKey.EndpointPlaceholder)}
          fieldTitle={t(EntitiesI18nKey.EndpointBase)}
          value={entity.baseEndpoint}
          onChange={onChangeEndpoint}
        />
      </div>
      <div className="flex flex-row justify-end w-full gap-2 px-6 py-4">
        <Button
          cssClass="secondary"
          dataTestId="cancelBtn"
          title={t(ButtonsI18nKey.Cancel)}
          onClick={() => onClose()}
        />

        <Button
          cssClass="primary"
          dataTestId="duplicateBtn"
          title={t(ButtonsI18nKey.Duplicate)}
          disable={!isValid}
          onClick={() => onDuplicate(entity)}
        />
      </div>
    </Popup>
  );
};

export default DuplicateAdapter;
