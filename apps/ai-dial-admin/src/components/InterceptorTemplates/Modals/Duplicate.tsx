import { FC, useCallback, useEffect, useState } from 'react';

import { ButtonsI18nKey, CreateI18nKey, DuplicateI18nKey } from '@/src/constants/i18n';
import { PopUpState } from '@/src/types/pop-up';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { FieldError } from '@/src/models/error';
import { useI18n } from '@/src/locales/client';
import { getErrorForName } from '@/src/utils/validation/name-error';

import { TextInputField } from '@/src/components/Common/InputField/InputField';
import Button from '@/src/components/Common/Button/Button';
import Popup from '@/src/components/Common/Popup/Popup';

interface Props {
  modalState: PopUpState;
  onClose: () => void;
  template: InterceptorTemplate;
  onDuplicate: (template: InterceptorTemplate) => void;
  names?: string[];
}

const DuplicateScheme: FC<Props> = ({ onDuplicate, modalState, onClose, template, names }) => {
  const t = useI18n() as (t: string) => string;

  const [clonedTemplate, setTemplate] = useState<InterceptorTemplate>({ ...template, name: `${template.name}_(copy)` });
  const [isValid, setIsValid] = useState(false);
  const [nameError, setNameError] = useState<FieldError | null>(null);

  const onChangeName = useCallback(
    (name: string) => {
      setNameError(getErrorForName(name, names, t));
      setTemplate({ ...clonedTemplate, name: name });
    },
    [names, t, clonedTemplate],
  );

  useEffect(() => {
    setIsValid(!getErrorForName(clonedTemplate.name, names, t));
  }, [clonedTemplate, names, t]);

  return (
    <Popup
      onClose={onClose}
      heading={t(DuplicateI18nKey.InterceptorTemplate)}
      portalId="DuplicateKey"
      state={modalState}
    >
      <div className="flex flex-col px-6 py-4">
        <TextInputField
          fieldTitle={t(CreateI18nKey.IdTitle)}
          elementId="name"
          placeholder={t(CreateI18nKey.IdPlaceholder)}
          value={clonedTemplate.name}
          onChange={onChangeName}
          errorText={nameError?.text}
          invalid={!!nameError}
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
          onClick={() => onDuplicate(clonedTemplate)}
        />
      </div>
    </Popup>
  );
};

export default DuplicateScheme;
