import React, { FC, useCallback } from 'react';
import classNames from 'classnames';
import { Container } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { EnvironmentVariable } from '@/src/models/deployments/variables';
import BaseProperties from '@/src/components/Containers/Fields/BaseProperties';
import ResourcesFields from '@/src/components/Containers/Fields/Resources/ResourcesFields';
import PortField from '@/src/components/Common/PortField/PortField';
import EnvVariables from '@/src/components/Containers/Fields/EnvVariables/EnvVariables';
import ServingProperties from './ServingProperties';
import Transport from '@/src/components/Containers/Fields/Transport/Transport';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
  isModal?: boolean;
  route: ApplicationRoute;
  names?: string[];
}

const ContainerProperties: FC<Props> = ({ container, setContainer, isModal, route, names }) => {
  const containerClassNames = classNames('flex flex-1 flex-col gap-4', !isModal && 'lg:w-[35%]');

  const onVariablesChange = useCallback(
    (variables: EnvironmentVariable[]) => {
      setContainer({
        ...container,
        metadata: {
          envs: variables,
        },
      });
    },
    [container, setContainer],
  );

  return (
    <div className={classNames('flex flex-col gap-4', !isModal && 'divide-y divide-primary')}>
      <div className={containerClassNames}>
        <BaseProperties container={container} setContainer={setContainer} names={names} isModal={isModal} />
        {!isModal && (
          <>
            {route === ApplicationRoute.ModelDeployments && (
              <ServingProperties container={container} setContainer={setContainer} />
            )}
            <ResourcesFields container={container} setContainer={setContainer} route={route} />
            {route === ApplicationRoute.McpDeployments && (
              <div className="flex gap-4">
                <Transport container={container} setContainer={setContainer} />
              </div>
            )}
            {!isModal && <PortField route={route} container={container} setContainer={setContainer} />}
          </>
        )}
      </div>
      {!isModal && (
        <div className="flex flex-col mt-8 pt-8">
          <EnvVariables variables={container.metadata.envs || []} onChangeVariables={onVariablesChange} />
        </div>
      )}
    </div>
  );
};

export default ContainerProperties;
