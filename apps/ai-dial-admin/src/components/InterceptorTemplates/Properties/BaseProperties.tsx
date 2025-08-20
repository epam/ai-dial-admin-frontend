import { FC, useState } from 'react';

import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { CreateI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { FieldError } from '@/src/models/error';
import { useI18n } from '@/src/locales/client';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import { getErrorForDescription } from '@/src/utils/validation/description-error';
import { getErrorForName } from '@/src/utils/validation/name-error';

import TextAreaField from '@/src/components/Common/TextAreaField/TextAreaField';

interface Props {
  template: InterceptorTemplate;
  setTemplate: (template: InterceptorTemplate) => void;
  names?: string[];
  isImmutable?: boolean;
}

const BaseProperties: FC<Props> = ({ template, setTemplate, names, isImmutable }) => {
  const t = useI18n() as (t: string) => string;

  const [nameError, setNameError] = useState<FieldError | null>(null);
  const [descriptionError, setDescriptionError] = useState<FieldError | null>(null);

  return (
    <div className="flex flex-col gap-6 h-full">
      {!isImmutable && (
        <TextInputField
          elementId="id"
          placeholder={t(EntityPlaceholdersI18nKey.Id)}
          fieldTitle={t(EntityFieldsI18nKey.id)}
          value={template.name}
          errorText={nameError?.text}
          invalid={!!nameError}
          onChange={(name) => {
            setNameError(getErrorForName(name, names, t));
            setTemplate({ ...template, name });
          }}
        />
      )}

      <TextInputField
        elementId="name"
        fieldTitle={t(EntityFieldsI18nKey.displayName)}
        placeholder={t(EntityPlaceholdersI18nKey.DisplayName)}
        value={template.displayName}
        onChange={(displayName) => {
          setTemplate({ ...template, displayName });
        }}
      />

      <TextAreaField
        elementId="description"
        fieldTitle={t(EntityFieldsI18nKey.description)}
        placeholder={t(EntityPlaceholdersI18nKey.Description)}
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
