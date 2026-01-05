import { FC, useEffect, useState } from 'react';
import { DialTextInputField } from '@epam/ai-dial-ui-kit';
import { Container } from '@/src/models/deployments/containers';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { getErrorForName } from '@/src/utils/validation/name-error';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import DescriptionControl from '@/src/components/EntityMainProperties/BaseProperties/Description';
import Maintainer from '@/src/components/EntityMainProperties/BaseProperties/Maintainer';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
  isModal?: boolean;
  names?: string[];
}

const BaseFields: FC<Props> = ({ container, setContainer, names, isModal }) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();

  const [nameError, setNameError] = useState<FieldError | null>(null);

  useEffect(() => {
    dispatch({
      type: ValidationActionType.SetField,
      field: 'name',
      isValid: !getErrorForName(container.name, names, t),
    });
  }, [container.name, container.description, container.author, dispatch, isModal, names, t]);

  useEffect(() => {
    if (resetCounter || (container.name != null && container.name.length > 0)) {
      setNameError(getErrorForName(container.name, names, t));
    }
  }, [resetCounter, container.name, names, t]);

  return (
    <div className="flex flex-col gap-8">
      <DialTextInputField
        fieldTitle={t(EntityFieldsI18nKey.name)}
        elementId="name"
        placeholder={t(EntityPlaceholdersI18nKey.Name)}
        value={container.name}
        errorText={nameError?.text}
        invalid={!!nameError}
        onChange={(name?: string) => {
          const error = getErrorForName(name, names, t);
          dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: !error });
          setNameError(error);
          setContainer({
            ...container,
            name: name || '',
          });
        }}
      />
      <DescriptionControl entity={container} onChangeEntity={setContainer} isFullWidth={isModal} />
      {!isModal && <Maintainer entity={container} onChangeEntity={setContainer} />}
    </div>
  );
};

export default BaseFields;
