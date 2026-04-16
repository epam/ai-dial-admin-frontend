import React, { FC } from 'react';

import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { Container } from '@/src/models/deployments/containers';
import { Image } from '@/src/models/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';
import { CONTAINER_SOURCE_TYPE } from '@/src/types/deployments/containers';
import { isEditDisabled } from '@/src/utils/deployments/containers';

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
  image?: Image;
  names?: string[];
  isModal?: boolean;
  route: ApplicationRoute;
}

const ContainerFields: FC<Props> = ({ container, setContainer, image, isModal, route, names }) => {
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const disabled = (isModal ? false : isReadOnlyAdmin) || isEditDisabled(container);

  return (
    <div className="flex flex-col gap-y-8">
      <ContainerBase
        container={container}
        setContainer={setContainer}
        names={names}
        isModal={isModal}
        disabled={disabled}
      />
      {(!isModal || container.source?.$type !== CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE) && (
        <ContainerSource
          container={container}
          setContainer={setContainer}
          image={image}
          isModal={isModal}
          route={route}
          disabled={disabled}
        />
      )}
      {!isModal && (
        <div className="flex flex-col gap-y-8">
          <ContainerEndpoint container={container} setContainer={setContainer} route={route} disabled={disabled} />
          {container.source?.$type !== CONTAINER_SOURCE_TYPE.NGC_REGISTRY && (
            <ContainerAutoscaling container={container} setContainer={setContainer} disabled={disabled} />
          )}
          <ContainerVariables container={container} setContainer={setContainer} disabled={disabled} />
          <ContainerResources container={container} setContainer={setContainer} route={route} disabled={disabled} />
          <ContainerConfiguration container={container} setContainer={setContainer} disabled={disabled} />
          <ContainerStartupProbe container={container} setContainer={setContainer} disabled={disabled} />
        </div>
      )}
    </div>
  );
};

export default ContainerFields;
