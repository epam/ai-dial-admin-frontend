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
  const [imageRefError, setImageRefError] = useState<FieldError | null>(null);

  const SERVING_TYPES = [
    { value: MODEL_SOURCE_TYPE.HF, label: t(ContainersI18nKey.ModelTypeHF) },
    { value: MODEL_SOURCE_TYPE.NIM, label: t(ContainersI18nKey.ModelTypeNIM) },
  ];

  const getModelNameError = useCallback(
    (modelName?: string, $type?: MODEL_SOURCE_TYPE) => {
      return $type === MODEL_SOURCE_TYPE.HF
        ? getErrorForHfModelName(modelName, t)
        : getDeploymentsURIError(modelName, t);
    },
    [t],
  );

  const onChangeModelName = useCallback(
    (modelName?: string) => {
      const error = getModelNameError(modelName, container.source?.$type as MODEL_SOURCE_TYPE);
      setImageRefError(error);
      setContainer({ ...container, source: { ...container.source, modelName } as SERVING_SOURCE });
      dispatch({
        type: ValidationActionType.SetField,
        field: 'modelName',
        isValid: !error,
      });
    },
    [container, setContainer, dispatch, getModelNameError],
  );

  const onChangeModelSourceType = useCallback(
    ($type?: MODEL_SOURCE_TYPE) => {
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

      if (container.source?.imageRef) {
        const error = getModelNameError(container.source?.imageRef, $type);
        setImageRefError(error);
      }
      setContainer(updated);
    },
    [container, setContainer, getModelNameError],
  );

  useEffect(() => {
    dispatch({
      type: ValidationActionType.SetField,
      field: 'modelName',
      isValid: !getModelNameError(container.source?.imageRef, container.source?.$type),
    });
  }, [container.source, dispatch, getModelNameError, t]);

  useEffect(() => {
    if (resetCounter || (container.source?.imageRef != null && container.source.imageRef.length > 0)) {
      const error = getModelNameError(container.source?.imageRef, container.source?.$type);
      setImageRefError(error);
    } else {
      setImageRefError(null);
    }
  }, [container.source, resetCounter, getModelNameError]);

  return (
    <div className="flex flex-col gap-4">
      <DialSelectField
        elementId="modelSourceType"
        fieldTitle={t(EntitiesI18nKey.SourceType)}
        options={SERVING_TYPES}
        value={container.source?.$type}
        onChange={($type) => onChangeModelSourceType($type as MODEL_SOURCE_TYPE)}
      />
      <DialTextInputField
        elementId="modelName"
        fieldTitle={
          container.source?.$type === MODEL_SOURCE_TYPE.HF
            ? t(EntityFieldsI18nKey.HFModelName)
            : t(EntityFieldsI18nKey.ImageURI)
        }
        value={container.source?.imageRef}
        errorText={imageRefError?.text}
        invalid={!!imageRefError}
        onChange={onChangeModelName}
      />
    </div>
  );
};

export default ServingProperties;
