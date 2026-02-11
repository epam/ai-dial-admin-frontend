import { FC } from 'react';

import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { Container } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { useI18n } from '@/src/locales/client';

import Accordion from '@/src/components/Common/Accordion/Accordion';
import Transport from '@/src/components/Deployments/Fields/ContainerEndpoint/Transport';
import Port from '@/src/components/Deployments/Fields/ContainerEndpoint/Port';
import EndpointPath from '@/src/components/Deployments/Fields/ContainerEndpoint/EndpointPath';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
  route: ApplicationRoute;
}

const ContainerEndpoint: FC<Props> = ({ container, setContainer, route }) => {
  const t = useI18n();

  return (
    <Accordion title={t(EntityFieldsI18nKey.EndpointConfiguration)}>
      <div className="flex flex-col gap-y-8">
        {route === ApplicationRoute.McpContainers && (
          <div className="flex gap-4">
            <Transport container={container} setContainer={setContainer} />
            <EndpointPath container={container} setContainer={setContainer} />
          </div>
        )}
        <Port container={container} setContainer={setContainer} />
      </div>
    </Accordion>
  );
};

export default ContainerEndpoint;
