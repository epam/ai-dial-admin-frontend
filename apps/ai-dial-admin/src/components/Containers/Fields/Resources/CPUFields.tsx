import { FC, useEffect, useState } from 'react';
import { DialNumberInputField } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { Container } from '@/src/models/deployments/containers';
import { FieldError } from '@/src/models/error';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getResourcesConflictError, getCPUError } from '@/src/utils/deployments/validation';
import { useI18n } from '@/src/locales/client';
import { isEditDisabled } from '@/src/utils/deployments/containers';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
}

const CPUFields: FC<Props> = ({ container, setContainer }) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();

  const [requestError, setRequestError] = useState<FieldError | null>(null);
  const [limitError, setLimitError] = useState<FieldError | null>(null);

  useEffect(() => {
    if (resetCounter || (container.resources?.requests?.cpu && Number(container.resources?.requests?.cpu) < 0)) {
      const error =
        getCPUError(Number(convertCoresToMilliCores(container.resources?.requests?.cpu)), t) ??
        getResourcesConflictError(
          Number(container.resources?.requests?.cpu),
          Number(container.resources?.limits?.cpu),
          t,
        );
      setRequestError(error);
      dispatch({
        type: ValidationActionType.SetField,
        field: 'cpuRequest',
        isValid: !error,
      });
    }
  }, [container.resources, dispatch, resetCounter, t]);

  useEffect(() => {
    if (resetCounter || (container.resources?.limits?.cpu && Number(container.resources?.limits?.cpu) < 0)) {
      const error =
        getCPUError(Number(convertCoresToMilliCores(container.resources?.limits?.cpu)), t) ??
        getResourcesConflictError(
          Number(container.resources?.requests?.cpu),
          Number(container.resources?.limits?.cpu),
          t,
        );
      setLimitError(error);
      dispatch({
        type: ValidationActionType.SetField,
        field: 'cpuLimit',
        isValid: !error,
      });
    }
  }, [container.resources, dispatch, resetCounter, t]);

  function convertMilliCoresToCores(value: number): number {
    return parseFloat((value / 1000).toFixed(3));
  }

  function convertCoresToMilliCores(value?: string): string {
    return String(Math.round(Number(value) * 1000));
  }

  return (
    <div className="flex flex-col lg:flex-row gap-2">
      <DialNumberInputField
        elementId="cpuRequest"
        containerClassName="w-[180px]"
        fieldTitle={t(EntityFieldsI18nKey.CPURequest)}
        value={convertCoresToMilliCores(container.resources?.requests?.cpu)}
        errorText={requestError?.text}
        invalid={!!requestError}
        suffix="m"
        disabled={isEditDisabled(container)}
        onChange={(cpuRequest) => {
          const error =
            getCPUError(cpuRequest as number, t) ??
            getResourcesConflictError(
              convertMilliCoresToCores(cpuRequest as number),
              Number(container.resources?.limits?.cpu),
              t,
            );
          if (!error) {
            setLimitError(error);
            dispatch({
              type: ValidationActionType.SetField,
              field: 'cpuLimit',
              isValid: !error,
            });
          }
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
                cpu: `${convertMilliCoresToCores(cpuRequest as number)}`,
              },
            },
          });
        }}
      />
      <DialNumberInputField
        containerClassName="w-[180px]"
        elementId="cpuLimit"
        fieldTitle={t(EntityFieldsI18nKey.CPULimit)}
        value={convertCoresToMilliCores(container.resources?.limits?.cpu)}
        suffix="m"
        errorText={limitError?.text}
        invalid={!!limitError}
        disabled={isEditDisabled(container)}
        onChange={(cpuLimit?: number | string) => {
          const error =
            getCPUError(cpuLimit as number, t) ??
            getResourcesConflictError(
              Number(container.resources?.requests?.cpu),
              convertMilliCoresToCores(cpuLimit as number),
              t,
            );
          if (!error) {
            setRequestError(error);
            dispatch({
              type: ValidationActionType.SetField,
              field: 'cpuRequest',
              isValid: !error,
            });
          }
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
                cpu: `${convertMilliCoresToCores(cpuLimit as number)}`,
              },
            },
          });
        }}
      />
    </div>
  );
};

export default CPUFields;
