import { FC, useEffect, useState } from 'react';
import { ButtonVariant, DialButton, DialPopup } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, DuplicateI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { InterceptorTemplate } from '@/src/models/interceptor-template';

import DisplayNameControl from '@/src/components/EntityMainProperties/BaseProperties/DisplayName';
import IdControl from '@/src/components/EntityMainProperties/BaseProperties/Id';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';

interface Props {
  isModalOpen: boolean;
  onClose: () => void;
  template: InterceptorTemplate;
  onDuplicate: (template: InterceptorTemplate) => void;
  names?: string[];
}
const DuplicateTemplate: FC<Props> = ({ onDuplicate, isModalOpen, onClose, template, names }) => {
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
    <DialPopup
      onClose={onClose}
      title={t(DuplicateI18nKey.InterceptorTemplate)}
      portalId="DuplicateTemplate"
      open={isModalOpen}
      footer={
        <div className="flex flex-row justify-end w-full gap-2 px-6 py-4">
          <DialButton variant={ButtonVariant.Secondary} title={t(ButtonsI18nKey.Cancel)} onClick={() => onClose()} />

          <DialButton
            variant={ButtonVariant.Primary}
            title={t(ButtonsI18nKey.Duplicate)}
            disable={!isValid}
            onClick={() => onDuplicate(clonedTemplate)}
          />
        </div>
      }
    >
      <div className="flex flex-col px-6 py-4 gap-y-6">
        <IdControl entity={clonedTemplate} names={names} onChangeEntity={setTemplate} />

        <DisplayNameControl
          displayName={clonedTemplate.displayName}
          onChange={(displayName) => setTemplate({ ...clonedTemplate, displayName })}
        />
      </div>
    </DialPopup>
  );
};

export default DuplicateTemplate;
