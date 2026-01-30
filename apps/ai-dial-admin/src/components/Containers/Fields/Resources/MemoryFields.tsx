import { FC, useEffect, useState } from 'react';
import { DialNumberInputField } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { Container } from '@/src/models/deployments/containers';
import { FieldError } from '@/src/models/error';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getResourcesConflictError } from '@/src/utils/deployments/validation';
import { useI18n } from '@/src/locales/client';
import { isEditDisabled } from '@/src/utils/deployments/containers';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
}

const MemoryFields: FC<Props> = ({ container, setContainer }) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();

  const [requestError, setRequestError] = useState<FieldError | null>(null);
  const [limitError, setLimitError] = useState<FieldError | null>(null);

  useEffect(() => {
    if (resetCounter || (container.resources?.requests?.memory && Number(container.resources?.requests?.memory) < 0)) {
      const error = getResourcesConflictError(
        Number(container.resources?.requests?.cpu),
        Number(container.resources?.limits?.cpu),
        t,
      );
      setRequestError(error);
      dispatch({
        type: ValidationActionType.SetField,
        field: 'memoryRequest',
        isValid: !error,
      });
    }
  }, [container.resources, dispatch, resetCounter, t]);

  useEffect(() => {
    if (resetCounter || (container.resources?.limits?.cpu && Number(container.resources?.limits?.cpu) < 0)) {
      const error = getResourcesConflictError(
        Number(container.resources?.requests?.cpu),
        Number(container.resources?.limits?.cpu),
        t,
      );
      setLimitError(error);
      dispatch({
        type: ValidationActionType.SetField,
        field: 'memoryLimit',
        isValid: !error,
      });
    }
  }, [container.resources, dispatch, resetCounter, t]);

  function convertMemoryToMb(value?: string): string {
    return String(Math.round(Number(value) / (1024 * 1024)));
  }

  return (
    <div className="flex gap-2 flex-col lg:flex-row">
      <DialNumberInputField
        elementId="memoryRequest"
        fieldTitle={t(EntityFieldsI18nKey.MemoryRequest)}
        value={convertMemoryToMb(container.resources?.requests?.memory)}
        suffix="Mb"
        errorText={requestError?.text}
        containerClassName="w-[180px]"
        invalid={!!requestError}
        disabled={isEditDisabled(container)}
        onChange={(memoryRequest) => {
          const error = getResourcesConflictError(
            (memoryRequest as number) * 1024 * 1024,
            Number(container.resources?.limits?.memory),
            t,
          );
          setRequestError(error);
          if (!error) {
            setLimitError(error);
            dispatch({
              type: ValidationActionType.SetField,
              field: 'memoryLimit',
              isValid: !error,
            });
          }
          dispatch({
            type: ValidationActionType.SetField,
            field: 'memoryRequest',
            isValid: !error,
          });
          setContainer({
            ...container,
            resources: {
              ...container.resources,
              requests: {
                ...container.resources?.requests,
                memory: `${(memoryRequest as number) * 1024 * 1024}`,
              },
            },
          });
        }}
      />
      <DialNumberInputField
        elementId="memoryLimit"
        fieldTitle={t(EntityFieldsI18nKey.MemoryLimit)}
        value={convertMemoryToMb(container.resources?.limits?.memory)}
        suffix="Mb"
        errorText={limitError?.text}
        invalid={!!limitError}
        disabled={isEditDisabled(container)}
        containerClassName="w-[180px]"
        onChange={(memoryLimit) => {
          const error = getResourcesConflictError(
            Number(container.resources?.requests?.memory),
            (memoryLimit as number) * 1024 * 1024,
            t,
          );
          if (!error) {
            setRequestError(error);
            dispatch({
              type: ValidationActionType.SetField,
              field: 'memoryRequest',
              isValid: !error,
            });
          }
          setLimitError(error);
          dispatch({
            type: ValidationActionType.SetField,
            field: 'memoryLimit',
            isValid: !error,
          });
          setContainer({
            ...container,
            resources: {
              ...container.resources,
              limits: {
                ...container.resources?.limits,
                memory: `${(memoryLimit as number) * 1024 * 1024}`,
              },
            },
          });
        }}
      />
    </div>
  );
};

export default MemoryFields;
