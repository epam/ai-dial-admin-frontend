import { ContainersI18nKey, EntitiesI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { Container } from '@/src/models/deployments/containers';
import { FieldError } from '@/src/models/error';
import { MODEL_SOURCE_TYPE, SERVING_SOURCE } from '@/src/types/deployments/containers';
import { getDeploymentsURIError, getErrorForHfModelName } from '@/src/utils/deployments/validation';
import { DialSelectField, DialTextInputField } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useState } from 'react';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
}

const ServingProperties: FC<Props> = ({ container, setContainer }) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();
  const [modelNameError, setModelNameError] = useState<FieldError | null>(null);

  const SERVING_TYPES = [
    { value: MODEL_SOURCE_TYPE.HF, label: t(ContainersI18nKey.ModelTypeHF) },
    { value: MODEL_SOURCE_TYPE.NIM, label: t(ContainersI18nKey.ModelTypeNIM) },
  ];

  useEffect(() => {
    dispatch({
      type: ValidationActionType.SetField,
      field: 'modelName',
      isValid:
        container.source?.$type === MODEL_SOURCE_TYPE.HF
          ? !getErrorForHfModelName(container.source?.modelName, t)
          : !getDeploymentsURIError(container.source?.modelName, t),
    });
  }, [container.source, dispatch, t]);

  useEffect(() => {
    if (resetCounter || (container.source?.modelName != null && container.source.modelName.length > 0)) {
      setModelNameError(getErrorForHfModelName(container.source?.modelName, t));
    }
  }, [container.source?.modelName, resetCounter, t]);

  const onChangeModelName = useCallback(
    (modelName?: string) => {
      const error =
        container.source?.$type === MODEL_SOURCE_TYPE.HF
          ? getErrorForHfModelName(modelName, t)
          : getDeploymentsURIError(container.source?.modelName, t);
      setModelNameError(error);
      setContainer({ ...container, source: { ...container.source, modelName } as SERVING_SOURCE });
      dispatch({
        type: ValidationActionType.SetField,
        field: 'modelName',
        isValid: !error,
      });
    },
    [container, setContainer, dispatch, t],
  );

  return (
    <div className="flex flex-col gap-4">
      <DialSelectField
        elementId="modelSourceType"
        fieldTitle={t(EntitiesI18nKey.SourceType)}
        options={SERVING_TYPES}
        value={container.source?.$type}
        onChange={($type) => {
          const updated = {
            ...container,
            source: {
              ...container.source,
              $type: $type as MODEL_SOURCE_TYPE,
            },
          };

          if ($type === MODEL_SOURCE_TYPE.HF) {
            updated.modelFormat = 'huggingface';
          } else {
            delete updated.modelFormat;
          }

          setContainer(updated);
        }}
      />
      <DialTextInputField
        elementId="modelName"
        fieldTitle={t(EntityFieldsI18nKey.HFModelName)}
        value={container.source?.modelName}
        errorText={modelNameError?.text}
        invalid={!!modelNameError}
        onChange={onChangeModelName}
      />
    </div>
  );
};

export default ServingProperties;
