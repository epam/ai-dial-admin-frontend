import { FC } from 'react';

import { ApplicationRoute } from '@/src/types/routes';
import { Container } from '@/src/models/deployments/containers';
import { MODEL_SOURCE_TYPE } from '@/src/types/deployments/containers';

import BaseFields from '@/src/components/Containers/Fields/BaseFields/BaseFields';
import ModelSourceFields from '@/src/components/Containers/Fields/ModelSourceFields/ModelSourceFields';
import EnvVariables from '@/src/components/Containers/Fields/EnvVariables/EnvVariables';
import ResourcesFields from '@/src/components/Containers/Fields/Resources/ResourcesFields';
import EndpointConfiguration from '@/src/components/Containers/Fields/EndpointConfiguration/EndpointConfiguration';
import Configuration from '@/src/components/Containers/Fields/Configuration/Configuration';
import Autoscaling from '@/src/components/Containers/Fields/AutoScale/AutoScale';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
  route: ApplicationRoute;
  names?: string[];
  isModal?: boolean;
}

const ServingProperties: FC<Props> = ({ container, setContainer, names, isModal, route }) => {
  return (
    <div className="flex flex-col gap-y-8">
      <BaseFields container={container} setContainer={setContainer} names={names} isModal={isModal} />
      <ModelSourceFields container={container} setContainer={setContainer} isModal={isModal} route={route} />
      {!isModal && (
        <div className="flex flex-col gap-y-8">
          <EndpointConfiguration container={container} setContainer={setContainer} route={route} />
          {container.source?.$type === MODEL_SOURCE_TYPE.HF && (
            <Autoscaling container={container} setContainer={setContainer} />
          )}
          <EnvVariables container={container} setContainer={setContainer} />
          <ResourcesFields container={container} setContainer={setContainer} route={route} />
          {container.source?.$type === MODEL_SOURCE_TYPE.HF && (
            <Configuration container={container} setContainer={setContainer} />
          )}
        </div>
      )}
    </div>
  );
};

export default ServingProperties;
