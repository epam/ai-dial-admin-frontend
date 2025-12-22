import React, { FC, useCallback, useEffect } from 'react';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { getPathError } from '@/src/utils/deployments/validation';
import { DialTextInputField } from '@epam/ai-dial-ui-kit';
import { Container } from '@/src/models/deployments/containers';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
}

const McpEndpointPath: FC<Props> = ({ container, setContainer }) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();

  const [pathError, setPathError] = React.useState<FieldError | null>(null);

  useEffect(() => {
    if (container.mcpEndpointPath) {
      if (resetCounter || container.mcpEndpointPath?.length > 0) {
        setPathError(getPathError(container.mcpEndpointPath, t));
      }
    }
  }, [container.mcpEndpointPath, resetCounter, t]);

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
    <DialTextInputField
      fieldTitle={t(EntityFieldsI18nKey.ContainerEndpointPath)}
      elementId="mcpEndpointPath"
      placeholder={t(EntityPlaceholdersI18nKey.ContainerEndpointPath)}
      value={container.mcpEndpointPath || ''}
      errorText={pathError?.text}
      invalid={!!pathError}
      optional={true}
      onChange={onPathChange}
    />
  );
};

export default McpEndpointPath;
