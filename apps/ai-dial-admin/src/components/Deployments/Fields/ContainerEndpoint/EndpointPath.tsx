import { FC, useCallback, useEffect, useState } from 'react';
import { DialInput } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { Container } from '@/src/models/deployments/containers';
import { FieldError } from '@/src/models/error';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getPathError } from '@/src/utils/deployments/validation';
import { isEditDisabled } from '@/src/utils/deployments/containers';
import { useI18n } from '@/src/locales/client';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
}

const EndpointPath: FC<Props> = ({ container, setContainer }) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();
  const [pathError, setPathError] = useState<FieldError | null>(null);

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
    <DialInput
      label={t(EntityFieldsI18nKey.ContainerEndpointPath)}
      id="mcpEndpointPath"
      containerClassName={STANDARD_CONTROL_WIDTH}
      placeholder={t(EntityPlaceholdersI18nKey.ContainerEndpointPath)}
      value={container.mcpEndpointPath || ''}
      errorText={pathError?.text}
      invalid={!!pathError}
      onChange={onPathChange}
      disabled={isEditDisabled(container)}
    />
  );
};

export default EndpointPath;
