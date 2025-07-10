import { FC, useState } from 'react';

import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { CreateI18nKey } from '@/src/constants/i18n';
import { FieldError } from '@/src/models/error';
import { useI18n } from '@/src/locales/client';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import { getErrorForDescription } from '@/src/utils/validation/description-error';
import { getErrorForName } from '@/src/utils/validation/name-error';

import TextAreaField from '@/src/components/Common/TextAreaField/TextAreaField';

interface Props {
  template: InterceptorTemplate;
  setTemplate: (template: InterceptorTemplate) => void;
  names: string[];
  isImmutable?: boolean;
}

const BaseProperties: FC<Props> = ({ template, setTemplate, names, isImmutable }) => {
  const t = useI18n() as (t: string) => string;

  const [nameError, setNameError] = useState<FieldError | null>(null);
  const [descriptionError, setDescriptionError] = useState<FieldError | null>(null);

  return (
    <div className="flex flex-col gap-6 h-full">
      <TextInputField
        elementId="id"
        fieldTitle={t(CreateI18nKey.IdTitle)}
        placeholder={t(CreateI18nKey.IdPlaceholder)}
        value={template.name}
        errorText={nameError?.text}
        invalid={!!nameError}
        onChange={(name) => {
          setNameError(getErrorForName(name, names, t));
          setTemplate({ ...template, name });
        }}
        disabled={isImmutable}
      />

      <TextInputField
        elementId="name"
        fieldTitle={t(CreateI18nKey.NameTitle)}
        placeholder={t(CreateI18nKey.NamePlaceholder)}
        value={template.displayName}
        onChange={(displayName) => {
          setTemplate({ ...template, displayName });
        }}
      />

      <TextAreaField
        elementId="description"
        fieldTitle={t(CreateI18nKey.DescriptionTitle)}
        placeholder={t(CreateI18nKey.DescriptionPlaceholder)}
        optional={true}
        errorText={descriptionError?.text}
        invalid={!!descriptionError}
        value={template.description}
        onChange={(description) => {
          setDescriptionError(getErrorForDescription(description, t));
          setTemplate({ ...template, description });
        }}
      />
    </div>
  );
};

export default BaseProperties;
