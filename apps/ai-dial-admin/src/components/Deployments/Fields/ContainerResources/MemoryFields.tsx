import { FC, useCallback, useEffect, useState } from 'react';
import { DialNumberInput } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { Container } from '@/src/models/deployments/containers';
import { FieldError } from '@/src/models/error';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { convertBytesToMb, convertMbToBytes, isEditDisabled } from '@/src/utils/deployments/containers';
import { getMemoryValueError, getResourcesConflictError } from '@/src/utils/deployments/validation';
import { useI18n } from '@/src/locales/client';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
}

const MemoryFields: FC<Props> = ({ container, setContainer }) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();

  const [requestError, setRequestError] = useState<FieldError | null>(null);
  const [limitError, setLimitError] = useState<FieldError | null>(null);

  const onChangeRequest = useCallback(
    (memoryRequest?: string | number) => {
      if (memoryRequest === void 0) {
        setRequestError(null);
        dispatch({
          type: ValidationActionType.SetField,
          field: 'memoryRequest',
          isValid: true,
        });
        const updated = {
          ...container,
          resources: {
            ...container.resources,
            requests: {
              ...container.resources?.requests,
            },
          },
        };
        delete updated.resources.requests?.memory;
        setContainer(updated);
      } else {
        const error = getMemoryValueError(memoryRequest as string, t);
        setRequestError(error);
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
              memory: convertMbToBytes(memoryRequest as string),
            },
          },
        });
      }
    },
    [container, dispatch, setContainer, t],
  );

  const onChangeLimit = useCallback(
    (memoryLimit?: string | number) => {
      if (memoryLimit === void 0) {
        setLimitError(null);
        dispatch({
          type: ValidationActionType.SetField,
          field: 'memoryLimit',
          isValid: true,
        });
        const updated = {
          ...container,
          resources: {
            ...container.resources,
            limits: {
              ...container.resources?.limits,
            },
          },
        };
        delete updated.resources?.limits?.memory;
        setContainer(updated);
      } else {
        const error = getMemoryValueError(memoryLimit as string, t);
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
              memory: convertMbToBytes(memoryLimit as string),
            },
          },
        });
      }
    },
    [container, dispatch, setContainer, t],
  );

  useEffect(() => {
    if (resetCounter || container.resources?.requests?.memory !== '') {
      const error = getMemoryValueError(convertMbToBytes(container.resources?.requests?.memory), t);
      setRequestError(error);
      dispatch({
        type: ValidationActionType.SetField,
        field: 'memoryRequest',
        isValid: !error,
      });
    }
  }, [container.resources, dispatch, resetCounter, t]);

  useEffect(() => {
    if (resetCounter || container.resources?.limits?.memory !== '') {
      const error = getMemoryValueError(convertMbToBytes(container.resources?.limits?.memory), t);
      setLimitError(error);
      dispatch({
        type: ValidationActionType.SetField,
        field: 'memoryLimit',
        isValid: !error,
      });
    }
  }, [container.resources, dispatch, resetCounter, t]);

  useEffect(() => {
    const error = getResourcesConflictError(
      container.resources?.requests?.memory,
      container.resources?.limits?.memory,
      t,
    );
    dispatch({
      type: ValidationActionType.SetField,
      field: 'memoryLimit',
      isValid: !error,
    });
    setLimitError(error);
  }, [container.resources, dispatch, t]);

  return (
    <div className="flex gap-2 flex-col lg:flex-row">
      <DialNumberInput
        id="memoryRequest"
        containerClassName="w-[180px]"
        className="w-[180px]"
        labelProps={{ label: t(EntityFieldsI18nKey.MemoryRequest) }}
        value={container.resources?.requests?.memory ? convertBytesToMb(container.resources?.requests?.memory) : ''}
        // suffix="Mb"
        errorText={requestError?.text}
        invalid={!!requestError}
        disabled={isEditDisabled(container)}
        onChange={onChangeRequest}
      />
      <DialNumberInput
        id="memoryLimit"
        className="w-[180px]"
        labelProps={{ label: t(EntityFieldsI18nKey.MemoryLimit) }}
        value={container.resources?.limits?.memory ? convertBytesToMb(container.resources?.limits?.memory) : ''}
        // suffix="Mb"
        errorText={limitError?.text}
        invalid={!!limitError}
        disabled={isEditDisabled(container)}
        onChange={onChangeLimit}
      />
    </div>
  );
};

export default MemoryFields;
