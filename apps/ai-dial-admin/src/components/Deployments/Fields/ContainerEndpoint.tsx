import { FC, useEffect, useState } from 'react';

import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { Container } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { useI18n } from '@/src/locales/client';

import Accordion from '@/src/components/Common/Accordion/Accordion';
import Transport from '@/src/components/Deployments/Fields/ContainerEndpoint/Transport';
import Port from '@/src/components/Deployments/Fields/ContainerEndpoint/Port';
import EndpointPath from '@/src/components/Deployments/Fields/ContainerEndpoint/EndpointPath';
import { isErrorPresent } from '@/src/utils/deployments/containers';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
  route: ApplicationRoute;
  disabled?: boolean;
}

const ContainerEndpoint: FC<Props> = ({ container, setContainer, route, disabled }) => {
  const t = useI18n();
  const { errorFields, isValid } = useSaveValidationContext();

  const [isSectionInvalid, setSectionInvalid] = useState(false);

  useEffect(() => {
    if (!isValid) {
      setSectionInvalid(
        isErrorPresent(errorFields, ['transport', 'mcpEndpointPath', 'containerGrpcPort', 'containerPort']),
      );
    } else {
      setSectionInvalid(false);
    }
  }, [errorFields, isValid]);

  return (
    <Accordion title={t(EntityFieldsI18nKey.EndpointConfiguration)} errorIndicator={isSectionInvalid}>
      <div className="flex flex-col gap-y-8">
        {route === ApplicationRoute.McpContainers && (
          <div className="flex gap-4">
            <Transport container={container} setContainer={setContainer} disabled={disabled} />
            <EndpointPath container={container} setContainer={setContainer} disabled={disabled} />
          </div>
        )}
        <Port container={container} setContainer={setContainer} disabled={disabled} />
      </div>
    </Accordion>
  );
};

export default ContainerEndpoint;
