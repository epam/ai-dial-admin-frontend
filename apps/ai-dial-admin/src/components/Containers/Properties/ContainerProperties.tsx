import React, { FC, useCallback, useState } from 'react';
import classNames from 'classnames';
import { DialSelectField, DialTextInputField } from '@epam/ai-dial-ui-kit';
import { Container } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { TRANSPORTS } from '@/src/constants/deployments/containers';
import { EnvironmentVariable } from '@/src/models/deployments/variables';
import BaseProperties from '@/src/components/Containers/Properties/BaseProperties';
import ContainerResourcesFields from '@/src/components/Containers/Properties/ContainerResourcesFields';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { CONTAINER_TRANSPORT } from '@/src/types/deployments/containers';
import PortField from '@/src/components/Common/PortField/PortField';
import EnvVariables from '@/src/components/Containers/Properties/EnvVariables/EnvVariables';
import { getPathError } from '@/src/utils/deployments/validation';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
  isModal?: boolean;
  route: ApplicationRoute;
  names?: string[];
}

const ContainerProperties: FC<Props> = ({ container, setContainer, isModal, route, names }) => {
  const t = useI18n();

  const [pathError, setPathError] = useState<FieldError | null>(null);

  const containerClassNames = classNames('flex flex-1 flex-col gap-4', !isModal && 'lg:w-[35%]');
  const transportList = TRANSPORTS;

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
            <ContainerResourcesFields container={container} setContainer={setContainer} route={route} />
            {route === ApplicationRoute.McpDeployments && (
              <div className="flex gap-4">
                <div className="max-w-[160px]">
                  <DialSelectField
                    elementId="transport"
                    value={container.transport || transportList[0].value}
                    options={transportList}
                    fieldTitle={t(EntityFieldsI18nKey.Transport)}
                    onChange={(transportId) => {
                      const selectedTransport =
                        transportList.find((source) => source.value === transportId) || transportList[0];

                      setContainer({
                        ...container,
                        transport: selectedTransport.value as CONTAINER_TRANSPORT,
                      });
                    }}
                    optional={false}
                  />
                </div>
                <DialTextInputField
                  fieldTitle={t(EntityFieldsI18nKey.ContainerEndpointPath)}
                  elementId="mcpEndpointPath"
                  placeholder={t(EntityPlaceholdersI18nKey.ContainerEndpointPath)}
                  value={container.mcpEndpointPath || ''}
                  errorText={pathError?.text}
                  invalid={!!pathError}
                  optional={true}
                  onChange={(mcpEndpointPath?: string) => {
                    if (!mcpEndpointPath) {
                      const newContainer = { ...container };
                      delete newContainer.mcpEndpointPath;
                      setContainer(newContainer);
                    } else {
                      setPathError(getPathError(mcpEndpointPath as string, t));
                      setContainer({
                        ...container,
                        mcpEndpointPath: mcpEndpointPath,
                      });
                    }
                  }}
                />
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
