import React, { FC } from 'react';
import classNames from 'classnames';

import { ApplicationRoute } from '@/src/types/routes';
import { Container } from '@/src/models/deployments/containers';

import BaseFields from '@/src/components/Containers/Fields/BaseFields/BaseFields';
import ModelSourceFields from '@/src/components/Containers/Fields/ModelSourceFields/ModelSourceFields';
import EnvVariables from '@/src/components/Containers/Fields/EnvVariables/EnvVariables';
import ResourcesFields from '@/src/components/Containers/Fields/Resources/ResourcesFields';
import EndpointConfiguration from '@/src/components/Containers/Fields/EndpointConfiguration/EndpointConfiguration';
import Configuration from '@/src/components/Containers/Fields/Configuration/Configuration';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
  route: ApplicationRoute;
  names?: string[];
  isModal?: boolean;
}

const ServingProperties: FC<Props> = ({ container, setContainer, names, isModal, route }) => {
  const containerClassNames = classNames('flex flex-1 flex-col gap-8', !isModal && 'lg:w-[35%]');

  return (
    <div className="flex flex-col gap-8">
      <div className={containerClassNames}>
        <BaseFields container={container} setContainer={setContainer} names={names} isModal={isModal} />
        <ModelSourceFields container={container} setContainer={setContainer} />
      </div>
      {!isModal && (
        <div className="flex flex-col gap-y-8">
          <EndpointConfiguration container={container} setContainer={setContainer} route={route} />
          <EnvVariables container={container} setContainer={setContainer} />
          <ResourcesFields container={container} setContainer={setContainer} route={route} />
          <Configuration container={container} setContainer={setContainer} />
        </div>
      )}
    </div>
  );
};

export default ServingProperties;
