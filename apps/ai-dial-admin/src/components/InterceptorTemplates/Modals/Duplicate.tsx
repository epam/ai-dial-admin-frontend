import { FC, useEffect, useState } from 'react';

import { ButtonsI18nKey, DuplicateI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { PopUpState } from '@/src/types/pop-up';

import Button from '@/src/components/Common/Button/Button';
import Popup from '@/src/components/Common/Popup/Popup';
import DisplayNameControl from '@/src/components/EntityMainProperties/BaseProperties/DisplayName';
import IdControl from '@/src/components/EntityMainProperties/BaseProperties/Id';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';

interface Props {
  modalState: PopUpState;
  onClose: () => void;
  template: InterceptorTemplate;
  onDuplicate: (template: InterceptorTemplate) => void;
  names?: string[];
}
const DuplicateTemplate: FC<Props> = ({ onDuplicate, modalState, onClose, template, names }) => {
  const t = useI18n() as (t: string) => string;
  const { isValid, dispatch } = useSaveValidationContext();

  const [clonedTemplate, setTemplate] = useState<InterceptorTemplate>({
    ...template,
    name: `${template.name}_(copy)`,
  });

  // initial validation (disable save when no values entered yet)
  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: !!template.name });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Popup
      onClose={onClose}
      heading={t(DuplicateI18nKey.InterceptorTemplate)}
      portalId="DuplicateTemplate"
      state={modalState}
    >
      <div className="flex flex-col px-6 py-4 gap-y-6">
        <IdControl entity={clonedTemplate} names={names} onChangeEntity={setTemplate} />

        <DisplayNameControl
          displayName={clonedTemplate.displayName}
          onChange={(displayName) => setTemplate({ ...clonedTemplate, displayName })}
          required={true}
        />
      </div>
      <div className="flex flex-row justify-end w-full gap-2 px-6 py-4">
        <Button cssClass="secondary" title={t(ButtonsI18nKey.Cancel)} onClick={() => onClose()} />

        <Button
          cssClass="primary"
          title={t(ButtonsI18nKey.Duplicate)}
          disable={!isValid}
          onClick={() => onDuplicate(clonedTemplate)}
        />
      </div>
    </Popup>
  );
};

export default DuplicateTemplate;
