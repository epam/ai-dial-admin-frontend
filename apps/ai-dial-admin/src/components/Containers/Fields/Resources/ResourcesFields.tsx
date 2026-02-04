import { FC, useCallback } from 'react';
import { DialNumberInputField } from '@epam/ai-dial-ui-kit';

import { Container } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { useI18n } from '@/src/locales/client';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';

import Accordion from '@/src/components/Common/Accordion/Accordion';
import CPUFields from '@/src/components/Containers/Fields/Resources/CPUFields';
import MemoryFields from '@/src/components/Containers/Fields/Resources/MemoryFields';
import { isEditDisabled } from '@/src/utils/deployments/containers';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
  route: ApplicationRoute;
}

const ResourcesFields: FC<Props> = ({ container, setContainer, route }) => {
  const t = useI18n();

  const onChangeGpuRequest = useCallback(
    (gpuRequest?: string | number) => {
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
    },
    [container, setContainer],
  );

  return (
    <Accordion title={t(EntityFieldsI18nKey.Resources)}>
      <div className="flex flex-col gap-x-2 gap-y-8">
        <CPUFields container={container} setContainer={setContainer} />
        <MemoryFields container={container} setContainer={setContainer} />
        {route === ApplicationRoute.ModelServings && (
          <div className="flex gap-2 flex-col lg:flex-row">
            <DialNumberInputField
              elementId="gpuRequest"
              containerClassName="w-[180px]"
              fieldTitle={t(EntityFieldsI18nKey.GPURequest)}
              value={container.resources?.requests?.['nvidia.com/gpu']}
              disabled={isEditDisabled(container)}
              onChange={onChangeGpuRequest}
            />
          </div>
        )}
      </div>
    </Accordion>
  );
};

export default ResourcesFields;
