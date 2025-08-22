import { FC, useEffect, useState } from 'react';

import { ButtonsI18nKey, DuplicateI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { PopUpState } from '@/src/types/pop-up';
import { getErrorForName } from '@/src/utils/validation/name-error';

import Button from '@/src/components/Common/Button/Button';
import Popup from '@/src/components/Common/Popup/Popup';
import DisplayNameControl from '@/src/components/EntityMainProperties/BaseProperties/DisplayName';
import IdControl from '@/src/components/EntityMainProperties/BaseProperties/Id';

interface Props {
  modalState: PopUpState;
  onClose: () => void;
  template: InterceptorTemplate;
  onDuplicate: (template: InterceptorTemplate) => void;
  names?: string[];
}
const DuplicateTemplate: FC<Props> = ({ onDuplicate, modalState, onClose, template, names }) => {
  const t = useI18n() as (t: string) => string;

  const [clonedTemplate, setTemplate] = useState<InterceptorTemplate>({ ...template, name: `${template.name}_(copy)` });
  const [isValid, setIsValid] = useState(false);

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
        <IdControl entity={clonedTemplate} names={names} onChangeEntity={setTemplate} />

        <DisplayNameControl
          displayName={clonedTemplate.displayName}
          onChange={(displayName) => setTemplate({ ...clonedTemplate, displayName })}
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

export default DuplicateTemplate;
