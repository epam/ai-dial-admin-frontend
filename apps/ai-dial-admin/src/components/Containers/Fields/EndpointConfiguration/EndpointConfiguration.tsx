import React, { FC, useCallback, useEffect } from 'react';
import { DialTextInputField } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { Container } from '@/src/models/deployments/containers';
import { FieldError } from '@/src/models/error';
import { ApplicationRoute } from '@/src/types/routes';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getPathError } from '@/src/utils/deployments/validation';
import { useI18n } from '@/src/locales/client';

import Transport from '@/src/components/Containers/Fields/Transport/Transport';
import PortField from '@/src/components/Containers/Fields/PortField/PortField';
import Accordion from '@/src/components/Common/Accordion/Accordion';
import { isEditDisabled } from '@/src/utils/deployments/containers';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
  route: ApplicationRoute;
}

const EndpointConfiguration: FC<Props> = ({ container, setContainer, route }) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();

  const [pathError, setPathError] = React.useState<FieldError | null>(null);

  useEffect(() => {
    if (resetCounter || (container.mcpEndpointPath != null && container.mcpEndpointPath?.length > 0)) {
      const error = getPathError(container.mcpEndpointPath as string, t);
      setPathError(error);
      dispatch({
        type: ValidationActionType.SetField,
        field: 'mcpEndpointPath',
        isValid: !error,
      });
    }
  }, [container.mcpEndpointPath, dispatch, resetCounter, t]);

  const onPathChange = useCallback(
    (mcpEndpointPath?: string) => {
      if (!mcpEndpointPath) {
        setPathError(null);
        const newContainer = { ...container };
        delete newContainer.mcpEndpointPath;
        setContainer(newContainer);
      } else {
        const error = getPathError(mcpEndpointPath, t);
        dispatch({
          type: ValidationActionType.SetField,
          field: 'mcpEndpointPath',
          isValid: !error,
        });
        setPathError(error);
        setContainer({
          ...container,
          mcpEndpointPath: mcpEndpointPath,
        });
      }
    },
    [container, dispatch, setContainer, t],
  );

  return (
    <Accordion title={t(EntityFieldsI18nKey.EndpointConfiguration)}>
      <div className="flex flex-col gap-y-8">
        {route === ApplicationRoute.McpContainers && (
          <div className="flex gap-4">
            <Transport container={container} setContainer={setContainer} />
            <DialTextInputField
              fieldTitle={t(EntityFieldsI18nKey.ContainerEndpointPath)}
              elementId="mcpEndpointPath"
              containerClassName={STANDARD_CONTROL_WIDTH}
              placeholder={t(EntityPlaceholdersI18nKey.ContainerEndpointPath)}
              value={container.mcpEndpointPath || ''}
              errorText={pathError?.text}
              invalid={!!pathError}
              optional={true}
              onChange={onPathChange}
              disabled={isEditDisabled(container)}
            />
          </div>
        )}
        <PortField container={container} setContainer={setContainer} />
      </div>
    </Accordion>
  );
};

export default EndpointConfiguration;
