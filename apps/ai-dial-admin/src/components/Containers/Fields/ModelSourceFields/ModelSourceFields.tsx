import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { DialSelectField, DialTextInputField } from '@epam/ai-dial-ui-kit';
import {
  ContainersI18nKey,
  EntitiesI18nKey,
  EntityFieldsI18nKey,
  EntityPlaceholdersI18nKey,
} from '@/src/constants/i18n';
import { CONTAINER_TYPE, MODEL_FORMAT, MODEL_SOURCE_TYPE, SERVING_SOURCE } from '@/src/types/deployments/containers';
import { useI18n } from '@/src/locales/client';
import { Container } from '@/src/models/deployments/containers';
import { FieldError } from '@/src/models/error';
import { getDeploymentsURIError, getErrorForHfModelName } from '@/src/utils/deployments/validation';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { DEFAULT_SCALING } from '@/src/constants/deployments/containers';
import { isEditDisabled } from '@/src/utils/deployments/containers';
import { getControlClassName } from '@/src/utils/entities/view';

interface Props {
  container: Container;
  isFullWidth?: boolean;
  setContainer: (container: Container) => void;
}

const ModelSourceFields: FC<Props> = ({ container, setContainer, isFullWidth = false }) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();
  const containerClassName = useMemo(() => getControlClassName(isFullWidth), [isFullWidth]);

  const [imageRefError, setImageRefError] = useState<FieldError | null>(null);

  const SERVING_TYPES = [
    { value: MODEL_SOURCE_TYPE.HF, label: t(ContainersI18nKey.ModelTypeHF) },
    { value: MODEL_SOURCE_TYPE.NIM, label: t(ContainersI18nKey.ModelTypeNIM) },
  ];

  const getSourceError = useCallback(
    (modelName?: string, $type?: MODEL_SOURCE_TYPE) => {
      return $type === MODEL_SOURCE_TYPE.HF
        ? getErrorForHfModelName(modelName, t)
        : getDeploymentsURIError(modelName, t);
    },
    [t],
  );

  const onChangeImageRef = useCallback(
    (value?: string) => {
      const error = getSourceError(value, container.source?.$type as MODEL_SOURCE_TYPE);
      setImageRefError(error);
      if (container.source?.$type === MODEL_SOURCE_TYPE.HF) {
        setContainer({ ...container, source: { ...container.source, modelName: value } as SERVING_SOURCE });
      } else {
        setContainer({ ...container, source: { ...container.source, imageRef: value } as SERVING_SOURCE });
      }
      dispatch({
        type: ValidationActionType.SetField,
        field: 'modelSourceName',
        isValid: !error,
      });
    },
    [container, setContainer, dispatch, getSourceError],
  );

  const onChangeModelSourceType = useCallback(
    ($type?: MODEL_SOURCE_TYPE) => {
      const updated = {
        ...container,
        $type: $type === MODEL_SOURCE_TYPE.HF ? CONTAINER_TYPE.HF : CONTAINER_TYPE.NIM,
        source: {
          ...container.source,
          $type: $type as MODEL_SOURCE_TYPE,
        },
      };

      if ($type === MODEL_SOURCE_TYPE.HF) {
        updated.modelFormat = MODEL_FORMAT.HF;
        updated.scaling = DEFAULT_SCALING;
      } else {
        delete updated.modelFormat;
        delete updated.scaling;
      }

      if (container.source?.imageRef) {
        const error = getSourceError(container.source?.imageRef, $type);
        setImageRefError(error);
      }
      setContainer(updated);
    },
    [container, setContainer, getSourceError],
  );

  useEffect(() => {
    const source = container.source;
    const value = source?.$type === MODEL_SOURCE_TYPE.HF ? source?.modelName : source?.imageRef;

    dispatch({
      type: ValidationActionType.SetField,
      field: 'modelSourceName',
      isValid: !getSourceError(value, container.source?.$type),
    });
  }, [container.source, dispatch, getSourceError, t]);

  useEffect(() => {
    const source = container.source;
    const value = source?.$type === MODEL_SOURCE_TYPE.HF ? source?.modelName : source?.imageRef;

    if (resetCounter || (value && value.length > 0)) {
      const error = getSourceError(value, container.source?.$type);
      setImageRefError(error);
    }
  }, [container.source, resetCounter, getSourceError]);

  return (
    <div className="flex flex-col gap-y-8">
      <DialSelectField
        elementId="modelSourceType"
        fieldTitle={t(EntitiesI18nKey.SourceType)}
        options={SERVING_TYPES}
        value={container.source?.$type}
        containerClassName="w-[180px]"
        onChange={($type) => onChangeModelSourceType($type as MODEL_SOURCE_TYPE)}
        disabled={isEditDisabled(container)}
      />
      {container.source?.$type === MODEL_SOURCE_TYPE.NIM ? (
        <DialTextInputField
          elementId="imageRef"
          fieldTitle={t(EntityFieldsI18nKey.ImageURI)}
          placeholder={t(EntityPlaceholdersI18nKey.URI)}
          value={container.source?.imageRef}
          errorText={imageRefError?.text}
          invalid={!!imageRefError}
          onChange={onChangeImageRef}
          containerClassName={containerClassName}
          disabled={isEditDisabled(container)}
        />
      ) : (
        <DialTextInputField
          elementId="modelName"
          fieldTitle={t(EntityFieldsI18nKey.HFModelName)}
          placeholder={t(EntityPlaceholdersI18nKey.HFModelName)}
          value={container.source?.modelName}
          errorText={imageRefError?.text}
          invalid={!!imageRefError}
          containerClassName={containerClassName}
          onChange={onChangeImageRef}
          disabled={isEditDisabled(container)}
        />
      )}
    </div>
  );
};

export default ModelSourceFields;
