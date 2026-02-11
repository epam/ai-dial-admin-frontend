import { FC, useCallback, useEffect, useState } from 'react';
import { DialNumberInputField } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { Container } from '@/src/models/deployments/containers';
import { FieldError } from '@/src/models/error';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { convertCoresToMilliCores, convertMilliCoresToCores, isEditDisabled } from '@/src/utils/deployments/containers';
import { getCPUValueError, getResourcesConflictError } from '@/src/utils/deployments/validation';
import { useI18n } from '@/src/locales/client';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
}

const CPUFields: FC<Props> = ({ container, setContainer }) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();

  const [requestError, setRequestError] = useState<FieldError | null>(null);
  const [limitError, setLimitError] = useState<FieldError | null>(null);

  const onChangeRequest = useCallback(
    (cpuRequest?: number | string) => {
      if (cpuRequest === void 0) {
        setRequestError(null);
        dispatch({
          type: ValidationActionType.SetField,
          field: 'cpuRequest',
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
        delete updated.resources?.requests?.cpu;
        setContainer(updated);
      } else {
        const error = getCPUValueError(cpuRequest as string, t);
        setRequestError(error);
        dispatch({
          type: ValidationActionType.SetField,
          field: 'cpuRequest',
          isValid: !error,
        });
        setContainer({
          ...container,
          resources: {
            ...container.resources,
            requests: {
              ...container.resources?.requests,
              cpu: `${convertMilliCoresToCores(cpuRequest as string)}`,
            },
          },
        });
      }
    },
    [container, dispatch, setContainer, t],
  );

  const onChangeLimit = useCallback(
    (cpuLimit?: number | string) => {
      if (cpuLimit === void 0) {
        setLimitError(null);
        dispatch({
          type: ValidationActionType.SetField,
          field: 'cpuLimit',
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
        delete updated.resources?.limits?.cpu;
        setContainer(updated);
      } else {
        const error = getCPUValueError(cpuLimit as string, t);
        setLimitError(error);
        dispatch({
          type: ValidationActionType.SetField,
          field: 'cpuLimit',
          isValid: !error,
        });
        setContainer({
          ...container,
          resources: {
            ...container.resources,
            limits: {
              ...container.resources?.limits,
              cpu: `${convertMilliCoresToCores(cpuLimit as string)}`,
            },
          },
        });
      }
    },
    [container, dispatch, setContainer, t],
  );

  useEffect(() => {
    if (resetCounter || container.resources?.requests?.cpu !== '') {
      const error = getCPUValueError(convertCoresToMilliCores(container.resources?.requests?.cpu), t);
      setRequestError(error);
      dispatch({
        type: ValidationActionType.SetField,
        field: 'cpuRequest',
        isValid: !error,
      });
    }
  }, [container.resources, dispatch, resetCounter, t]);

  useEffect(() => {
    if (resetCounter || container.resources?.limits?.cpu !== '') {
      const error = getCPUValueError(convertCoresToMilliCores(container.resources?.limits?.cpu), t);
      setLimitError(error);
      dispatch({
        type: ValidationActionType.SetField,
        field: 'cpuLimit',
        isValid: !error,
      });
    }
  }, [container.resources, dispatch, resetCounter, t]);

  useEffect(() => {
    const error = getResourcesConflictError(container.resources?.requests?.cpu, container.resources?.limits?.cpu, t);
    dispatch({
      type: ValidationActionType.SetField,
      field: 'cpuLimit',
      isValid: !error,
    });
    setLimitError(error);
  }, [container.resources, dispatch, t]);

  return (
    <div className="flex flex-col lg:flex-row gap-2">
      <DialNumberInputField
        elementId="cpuRequest"
        containerClassName="w-[180px]"
        elementContainerClassName="w-[180px]"
        fieldTitle={t(EntityFieldsI18nKey.CPURequest)}
        value={container.resources?.requests?.cpu ? convertCoresToMilliCores(container.resources?.requests?.cpu) : ''}
        errorText={requestError?.text}
        invalid={!!requestError}
        suffix="m"
        disabled={isEditDisabled(container)}
        onChange={onChangeRequest}
      />
      <DialNumberInputField
        elementId="cpuLimit"
        elementContainerClassName="w-[180px]"
        fieldTitle={t(EntityFieldsI18nKey.CPULimit)}
        value={container.resources?.limits?.cpu ? convertCoresToMilliCores(container.resources?.limits?.cpu) : ''}
        suffix="m"
        errorText={limitError?.text}
        invalid={!!limitError}
        disabled={isEditDisabled(container)}
        onChange={onChangeLimit}
      />
    </div>
  );
};

export default CPUFields;
