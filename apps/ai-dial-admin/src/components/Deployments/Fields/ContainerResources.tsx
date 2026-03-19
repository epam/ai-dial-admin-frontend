import { FC, useCallback, useEffect, useState } from 'react';
import { DialNumberInput } from '@epam/ai-dial-ui-kit';

import { Container } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { FieldError } from '@/src/models/error';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getGpuError } from '@/src/utils/deployments/validation';
import { isEditDisabled, isErrorPresent } from '@/src/utils/deployments/containers';
import { useI18n } from '@/src/locales/client';

import Accordion from '@/src/components/Common/Accordion/Accordion';
import CPUFields from '@/src/components/Deployments/Fields/ContainerResources/CPUFields';
import MemoryFields from '@/src/components/Deployments/Fields/ContainerResources/MemoryFields';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
  route: ApplicationRoute;
  disabled?: boolean;
}

const ContainerResources: FC<Props> = ({ container, setContainer, route, disabled }) => {
  const t = useI18n();
  const isDisabled = disabled ?? isEditDisabled(container);
  const { dispatch, resetCounter, errorFields, isValid } = useSaveValidationContext();

  const [error, setError] = useState<FieldError | null>(null);
  const [isSectionInvalid, setSectionInvalid] = useState(false);

  useEffect(() => {
    if (!isValid) {
      setSectionInvalid(
        isErrorPresent(errorFields, ['gpuRequest', 'cpuRequest', 'cpuLimit', 'memoryRequest', 'memoryLimit']),
      );
    } else {
      setSectionInvalid(false);
    }
  }, [errorFields, isValid]);

  const onChangeGpuRequest = useCallback(
    (gpuRequest?: string | number) => {
      const error = getGpuError(gpuRequest as string, t);
      setError(error);
      dispatch({
        type: ValidationActionType.SetField,
        field: 'gpuRequest',
        isValid: !error,
      });
      setContainer({
        ...container,
        resources: {
          ...container.resources,
          requests: {
            ...container.resources?.requests,
            ['nvidia.com/gpu']: gpuRequest !== void 0 ? `${gpuRequest}` : '',
          },
          limits: {
            ...container.resources?.limits,
            ['nvidia.com/gpu']: gpuRequest !== void 0 ? `${gpuRequest}` : '',
          },
        },
      });
    },
    [container, dispatch, setContainer, t],
  );

  useEffect(() => {
    if (resetCounter || container.resources?.requests?.['nvidia.com/gpu'] !== '') {
      const error = getGpuError(container.resources?.requests?.['nvidia.com/gpu'], t);
      setError(error);
      dispatch({
        type: ValidationActionType.SetField,
        field: 'gpuRequest',
        isValid: !error,
      });
    }
  }, [container.resources?.requests, dispatch, resetCounter, t]);

  return (
    <Accordion title={t(EntityFieldsI18nKey.Resources)} errorIndicator={isSectionInvalid}>
      <div className="flex flex-col gap-x-2 gap-y-8">
        <CPUFields container={container} setContainer={setContainer} disabled={disabled} />
        <MemoryFields container={container} setContainer={setContainer} disabled={disabled} />
        {route === ApplicationRoute.ModelServings && (
          <div className="flex gap-2 flex-col lg:flex-row">
            <DialNumberInput
              id="gpuRequest"
              className="w-[180px]"
              labelProps={{ label: t(EntityFieldsI18nKey.GPURequest) }}
              value={container.resources?.requests?.['nvidia.com/gpu'] || ''}
              disabled={isDisabled}
              onChange={onChangeGpuRequest}
              invalid={!!error}
              error={error?.text}
            />
          </div>
        )}
      </div>
    </Accordion>
  );
};

export default ContainerResources;
