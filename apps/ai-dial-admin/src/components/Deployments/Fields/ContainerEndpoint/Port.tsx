import React, { FC, useCallback, useEffect, useState } from 'react';
import { DialNumberInput } from '@epam/ai-dial-ui-kit';

import { Container } from '@/src/models/deployments/containers';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { MODEL_SOURCE_TYPE } from '@/src/types/deployments/containers';
import { FieldError } from '@/src/models/error';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { isEditDisabled } from '@/src/utils/deployments/containers';
import { getPortError } from '@/src/utils/deployments/validation';
import { useI18n } from '@/src/locales/client';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
}

const Port: FC<Props> = ({ container, setContainer }) => {
  const t = useI18n();
  const { resetCounter, dispatch } = useSaveValidationContext();

  const [portError, setPortError] = useState<FieldError | null>(null);
  const [grpcPortError, setGrpcPortError] = useState<FieldError | null>(null);

  const onPortChange = useCallback(
    (containerPort?: number | string) => {
      if (containerPort === 0) {
        const { containerPort: __, ...rest } = container;
        setContainer(rest);
      } else {
        const error = getPortError(containerPort as number, t);
        setPortError(error);
        dispatch({ type: ValidationActionType.SetField, field: 'containerPort', isValid: !error });
        setContainer({
          ...container,
          containerPort: containerPort as number,
        });
      }
    },
    [container, dispatch, setContainer, t],
  );

  const onGRPCPortChange = useCallback(
    (containerGrpcPort?: number | string) => {
      if (containerGrpcPort === 0) {
        const { containerGrpcPort: __, ...rest } = container;
        setContainer(rest);
      } else {
        const error = getPortError(containerGrpcPort as number, t);
        setGrpcPortError(error);
        dispatch({ type: ValidationActionType.SetField, field: 'containerGrpcPort', isValid: !error });
        setContainer({
          ...container,
          containerGrpcPort: containerGrpcPort as number,
        });
      }
    },
    [container, dispatch, setContainer, t],
  );

  useEffect(() => {
    if (resetCounter || container.containerPort) {
      const error = getPortError(container.containerPort as number, t);
      setPortError(error);
      dispatch({ type: ValidationActionType.SetField, field: 'containerPort', isValid: !error });
    }
  }, [container.containerPort, dispatch, resetCounter, t]);

  useEffect(() => {
    if (resetCounter || container.containerGrpcPort) {
      const error = getPortError(container.containerGrpcPort as number, t);
      setGrpcPortError(error);
      dispatch({ type: ValidationActionType.SetField, field: 'containerGrpcPort', isValid: !error });
    }
  }, [container.containerGrpcPort, dispatch, resetCounter, t]);

  return (
    <div className="flex gap-4">
      <DialNumberInput
        containerClassName="max-w-[125px]"
        id="containerPort"
        labelProps={{ label: t(EntityFieldsI18nKey.Port) }}
        placeholder={t(EntityPlaceholdersI18nKey.Port)}
        value={container.containerPort}
        invalid={!!portError}
        errorText={portError?.text}
        onChange={onPortChange}
        disabled={isEditDisabled(container)}
      />
      {container.source?.$type === MODEL_SOURCE_TYPE.NIM && (
        <DialNumberInput
          containerClassName="max-w-[125px]"
          id="containerGRPCPort"
          labelProps={{ label: t(EntityFieldsI18nKey.GRPCPort) }}
          placeholder={t(EntityPlaceholdersI18nKey.Port)}
          value={container.containerGrpcPort}
          invalid={!!grpcPortError}
          errorText={grpcPortError?.text}
          onChange={onGRPCPortChange}
          disabled={isEditDisabled(container)}
        />
      )}
    </div>
  );
};

export default Port;
