import { FC, useState } from 'react';
import { DialNumberInputField } from '@epam/ai-dial-ui-kit';
import { Container } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { ErrorType } from '@/src/types/error-type';
import { EntityFieldsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import Accordion from '@/src/components/Common/Accordion/Accordion';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
  route: ApplicationRoute;
}

const ResourcesFields: FC<Props> = ({ container, setContainer, route }) => {
  const t = useI18n();

  const [cpuRequestError, setCpuRequestError] = useState<FieldError | null>(null);
  const [cpuLimitError, setCpuLimitError] = useState<FieldError | null>(null);

  function validateCpuValue(value: number): FieldError | null {
    if (value < 1) {
      return { type: ErrorType.INVALID, text: t(ErrorI18nKey.CpuError) };
    }

    return null;
  }

  function convertMilliCoresToCores(value: number): number {
    return parseFloat((value / 1000).toFixed(3));
  }

  function convertCoresToMilliCores(value?: string): string {
    return String(Math.round(Number(value) * 1000));
  }

  function convertMemoryToMb(value?: string): string {
    return String(Math.round(Number(value) / (1024 * 1024)));
  }

  return (
    <Accordion title={t(EntityFieldsI18nKey.Resources)}>
      <div className="flex flex-col gap-x-2 gap-y-4 lg:max-w-[35%]">
        <div className="flex flex-col lg:flex-row gap-2">
          <DialNumberInputField
            elementId="cpuRequest"
            fieldTitle={t(EntityFieldsI18nKey.CPURequest)}
            value={convertCoresToMilliCores(container.resources?.requests?.cpu)}
            errorText={cpuRequestError?.text}
            invalid={!!cpuRequestError}
            suffix="m"
            onChange={(cpuRequest) => {
              setCpuRequestError(validateCpuValue(cpuRequest as number));
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
            elementId="cpuLimit"
            fieldTitle={t(EntityFieldsI18nKey.CPULimit)}
            value={convertCoresToMilliCores(container.resources?.limits?.cpu)}
            errorText={cpuLimitError?.text}
            invalid={!!cpuLimitError}
            suffix="m"
            onChange={(cpuLimit?: number | string) => {
              setCpuLimitError(validateCpuValue(cpuLimit as number));
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
        <div className="flex gap-2 flex-col lg:flex-row">
          <DialNumberInputField
            elementId="memoryRequest"
            fieldTitle={t(EntityFieldsI18nKey.MemoryRequest)}
            value={convertMemoryToMb(container.resources?.requests?.memory)}
            suffix="Mb"
            onChange={(memoryRequest) => {
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
            onChange={(memoryLimit) => {
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
        {route === ApplicationRoute.ModelDeployments && (
          <div className="flex gap-2 flex-col lg:flex-row">
            <DialNumberInputField
              elementId="gpuRequest"
              fieldTitle={t(EntityFieldsI18nKey.GPURequest)}
              value={container.resources?.requests?.['nvidia.com/gpu']}
              onChange={(gpuRequest) => {
                setContainer({
                  ...container,
                  resources: {
                    ...container.resources,
                    requests: {
                      ...container.resources?.requests,
                      ['nvidia.com/gpu']: `${gpuRequest}`,
                    },
                    limits: {
                      ...container.resources?.limits,
                      ['nvidia.com/gpu']: `${gpuRequest}`,
                    },
                  },
                });
              }}
            />
          </div>
        )}
      </div>
    </Accordion>
  );
};

export default ResourcesFields;
