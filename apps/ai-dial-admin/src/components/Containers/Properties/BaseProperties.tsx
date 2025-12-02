import { FC, useState } from 'react';
import { DialTextAreaField, DialTextInputField } from '@epam/ai-dial-ui-kit';
import { Container } from '@/src/models/deployments/containers';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { getErrorForName } from '@/src/utils/validation/name-error';
import { getErrorForDescription } from '@/src/utils/validation/description-error';
import { getMaintainerError } from '@/src/utils/deployments/validation';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
  isModal?: boolean;
  names?: string[];
}

const BaseProperties: FC<Props> = ({ container, setContainer, names, isModal }) => {
  const t = useI18n() as (key: string) => string;

  const [nameError, setNameError] = useState<FieldError | null>(null);
  const [descriptionError, setDescriptionError] = useState<FieldError | null>(null);
  const [maintainerError, setMaintainerError] = useState<FieldError | null>(null);

  return (
    <>
      <DialTextInputField
        fieldTitle={t(EntityFieldsI18nKey.name)}
        elementId="name"
        placeholder={t(EntityPlaceholdersI18nKey.Name)}
        value={container.name}
        errorText={nameError?.text}
        invalid={!!nameError}
        onChange={(name?: string) => {
          setNameError(getErrorForName(name, names, t));
          setContainer({
            ...container,
            name: name || '',
          });
        }}
      />
      <DialTextAreaField
        elementId="description"
        fieldTitle={t(EntityFieldsI18nKey.description)}
        placeholder={t(EntityPlaceholdersI18nKey.Description)}
        elementClassName="min-h-[118px]"
        optional={true}
        value={container.description}
        errorText={descriptionError?.text}
        invalid={!!descriptionError}
        onChange={(description: string) => {
          setDescriptionError(getErrorForDescription(description, t));
          setContainer({
            ...container,
            description,
          });
        }}
      />
      {!isModal && (
        <DialTextInputField
          fieldTitle={t(EntityFieldsI18nKey.author)}
          elementId="author"
          placeholder={t(EntityPlaceholdersI18nKey.Maintainer)}
          value={container.author}
          disabled={false}
          optional={true}
          errorText={maintainerError?.text}
          invalid={!!maintainerError}
          onChange={(author?: string) => {
            setMaintainerError(getMaintainerError(author, t));
            setContainer({
              ...container,
              author,
            });
          }}
        />
      )}
    </>
  );
};

export default BaseProperties;
