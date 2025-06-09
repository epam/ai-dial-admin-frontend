import { FC, useCallback, useEffect, useState } from 'react';

import Button from '@/src/components/Common/Button/Button';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import Popup from '@/src/components/Common/Popup/Popup';
import { ButtonsI18nKey, CreateI18nKey, DuplicateI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PopUpState } from '@/src/types/pop-up';
import { DialApplicationScheme } from '@/src/models/dial/application';

interface Props {
  modalState: PopUpState;
  onClose: () => void;
  entity: DialApplicationScheme;
  onDuplicate: (entity: DialApplicationScheme) => void;
}

const DuplicateScheme: FC<Props> = ({ onDuplicate, modalState, onClose, entity }) => {
  const t = useI18n();

  const [clonedEntity, setEntity] = useState<DialApplicationScheme>({ ...entity, $id: '' });
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    setIsValid(!!clonedEntity.$id);
  }, [clonedEntity]);

  const onChangeId = useCallback(
    (id: string) => {
      setEntity({ ...clonedEntity, $id: id });
    },
    [setEntity, clonedEntity],
  );

  return (
    <Popup
      onClose={onClose}
      heading={t(DuplicateI18nKey.ApplicationRunnerHeader)}
      portalId="DuplicateKey"
      state={modalState}
    >
      <div className="flex flex-col px-6 py-4">
        <TextInputField
          fieldTitle={t(CreateI18nKey.IdTitle)}
          elementId="id"
          placeholder={t(CreateI18nKey.IdPlaceholder)}
          value={clonedEntity.$id}
          onChange={onChangeId}
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
          onClick={() => onDuplicate(clonedEntity)}
        />
      </div>
    </Popup>
  );
};

export default DuplicateScheme;
