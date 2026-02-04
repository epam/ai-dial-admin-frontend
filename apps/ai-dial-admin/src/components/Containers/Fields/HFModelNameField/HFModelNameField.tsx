import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { isEditDisabled } from '@/src/utils/deployments/containers';
import { DialSelectField } from '@epam/ai-dial-ui-kit';
import { Container, HuggingFaceModel } from '@/src/models/deployments/containers';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { getControlClassName } from '@/src/utils/entities/view';
import { SERVING_SOURCE } from '@/src/types/deployments/containers';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getErrorForHfModelName } from '@/src/utils/deployments/validation';
import { debounce } from 'lodash';
import { getHuggingFaceModels } from '@/src/app/actions/deployments';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
  isModal?: boolean;
}
const HfModelNameField: FC<Props> = ({ container, setContainer, isModal }) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();
  const [modelOptions, setModelOptions] = useState<{ value: string; label: string }[]>([]);

  const [modelNameError, setModelNameError] = useState<FieldError | null>(null);

  const containerClassName = useMemo(() => getControlClassName(isModal), [isModal]);

  const onChangeModelName = useCallback(
    (value?: string) => {
      const error = getErrorForHfModelName(value, t);
      setModelNameError(error);
      setContainer({ ...container, source: { ...container.source, modelName: value } as SERVING_SOURCE });

      dispatch({
        type: ValidationActionType.SetField,
        field: 'modelName',
        isValid: !error,
      });
    },
    [container, setContainer, dispatch, t],
  );

  const onModelNameType = useMemo(
    () =>
      debounce((value: string) => {
        if (value.length > 2) {
          getHuggingFaceModels(value).then(({ success, response }) => {
            if (success) {
              const models = response.models as HuggingFaceModel[];
              if (models.length) {
                setModelOptions(models.slice(0, 5).map((model) => ({ value: model.id, label: model.id })));
              }
            }
          });
        }
      }, 100),
    [],
  );

  useEffect(() => {
    if (resetCounter || (container.source?.modelName && container.source?.modelName.length > 0)) {
      const error = getErrorForHfModelName(container.source?.modelName);
      setModelNameError(error);
    }
  }, [container.source?.modelName, resetCounter]);

  return (
    <>
      <DialSelectField
        elementId="modelName"
        fieldTitle={t(EntityFieldsI18nKey.HFModelName)}
        placeholder={t(EntityPlaceholdersI18nKey.HFModelName)}
        inlineSearch={true}
        value={container.source?.modelName}
        customSelectedValue={container.source?.modelName}
        onChange={(value) => onChangeModelName(value as string)}
        onInlineQueryChange={(value) => onModelNameType(value)}
        options={modelOptions}
        error={modelNameError?.text}
        containerClassName={containerClassName}
        disabled={isEditDisabled(container)}
      />
    </>
  );
};

export default HfModelNameField;
