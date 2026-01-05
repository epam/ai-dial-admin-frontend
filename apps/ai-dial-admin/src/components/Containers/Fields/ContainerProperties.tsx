import React, { FC } from 'react';
import classNames from 'classnames';

import { Container } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';

import BaseFields from '@/src/components/Containers/Fields/BaseFields/BaseFields';
import ResourcesFields from '@/src/components/Containers/Fields/Resources/ResourcesFields';
import EnvVariables from '@/src/components/Containers/Fields/EnvVariables/EnvVariables';
import EndpointConfiguration from '@/src/components/Containers/Fields/EndpointConfiguration/EndpointConfiguration';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
  names?: string[];
  isModal?: boolean;
  route: ApplicationRoute;
}

const ContainerProperties: FC<Props> = ({ container, setContainer, isModal, route, names }) => {
  const containerClassNames = classNames('flex flex-1 flex-col gap-8', !isModal && 'lg:w-[35%]');

  return (
    <div className="flex flex-col gap-8">
      <div className={containerClassNames}>
        <BaseFields container={container} setContainer={setContainer} names={names} isModal={isModal} />
      </div>
      {!isModal && (
        <div className="flex flex-col gap-y-8">
          <EndpointConfiguration container={container} setContainer={setContainer} route={route} />
          <EnvVariables container={container} setContainer={setContainer} />
          <ResourcesFields container={container} setContainer={setContainer} route={route} />
        </div>
      )}
    </div>
  );
};

export default ContainerProperties;
