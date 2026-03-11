import React, { FC } from 'react';

import { Container } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { CONTAINER_SOURCE_TYPE } from '@/src/types/deployments/containers';

import ContainerBase from '@/src/components/Deployments/Fields/ContainerBase';
import ContainerSource from '@/src/components/Deployments/Fields/ContainerSource';
import ContainerEndpoint from '@/src/components/Deployments/Fields/ContainerEndpoint';
import ContainerResources from '@/src/components/Deployments/Fields/ContainerResources';
import ContainerAutoscaling from '@/src/components/Deployments/Fields/ContainerAutoscaling';
import ContainerVariables from '@/src/components/Deployments/Fields/ContainerVariables';
import ContainerConfiguration from '@/src/components/Deployments/Fields/ContainerConfiguration';
import ContainerStartupProbe from '@/src/components/Deployments/Fields/ContainerStartupProbe';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
  names?: string[];
  isModal?: boolean;
  route: ApplicationRoute;
}

const ContainerFields: FC<Props> = ({ container, setContainer, isModal, route, names }) => {
  return (
    <div className="flex flex-col gap-y-8">
      <ContainerBase container={container} setContainer={setContainer} names={names} isModal={isModal} />
      {(route === ApplicationRoute.ModelServings ||
        container.source?.$type === CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE) && (
        <ContainerSource container={container} setContainer={setContainer} isModal={isModal} route={route} />
      )}
      {!isModal && (
        <div className="flex flex-col gap-y-8">
          <ContainerEndpoint container={container} setContainer={setContainer} route={route} />
          {container.source?.$type !== CONTAINER_SOURCE_TYPE.NGC_REGISTRY && (
            <ContainerAutoscaling container={container} setContainer={setContainer} />
          )}
          <ContainerVariables container={container} setContainer={setContainer} />
          <ContainerResources container={container} setContainer={setContainer} route={route} />
          <ContainerConfiguration container={container} setContainer={setContainer} />
          <ContainerStartupProbe container={container} setContainer={setContainer} />
        </div>
      )}
    </div>
  );
};

export default ContainerFields;
