import React, { FC, useCallback, useEffect, useState } from 'react';
import { DialNumberInput, DialSelectField, DialInput, SelectOption } from '@epam/ai-dial-ui-kit';

import { EntityCaptionsI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { Container, ProbeConfig, ProbeProperties } from '@/src/models/deployments/containers';
import { PROBE_TYPE } from '@/src/types/deployments/containers';
import { FieldError } from '@/src/models/error';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getPortError, getPathError } from '@/src/utils/deployments/validation';
import { useI18n } from '@/src/locales/client';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
  disabled?: boolean;
}

const Endpoint: FC<Props> = ({ container, setContainer, disabled }) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();

  const [portError, setPortError] = useState<FieldError | null>(null);
  const [pathError, setPathError] = useState<FieldError | null>(null);

  const typeOptions: SelectOption[] = [
    { label: 'TCP', value: PROBE_TYPE.TCP },
    { label: 'HTTP GET', value: PROBE_TYPE.HTTP_GET },
  ];

  const onPortChange = useCallback(
    (port?: number | string) => {
      const error = getPortError(port as number, t, true);
      setPortError(error);
      dispatch({ type: ValidationActionType.SetField, field: 'port', isValid: !error });

      setContainer({
        ...container,
        probeProperties: {
          ...container.probeProperties,
          probe: {
            ...container.probeProperties?.probe,
            port: port as number,
          } as ProbeConfig,
        } as ProbeProperties,
      });
    },
    [container, dispatch, setContainer, t],
  );

  const onPathChange = useCallback(
    (path?: string | string[]) => {
      const error = getPathError(path as string, t, true);
      setPathError(error);
      dispatch({ type: ValidationActionType.SetField, field: 'path', isValid: !error });

      setContainer({
        ...container,
        probeProperties: {
          ...container.probeProperties,
          probe: {
            ...(container.probeProperties?.probe as ProbeConfig),
            path,
          },
        } as ProbeProperties,
      });
    },
    [container, dispatch, setContainer, t],
  );

  const onTypeChange = useCallback(
    ($type?: string | string[]) => {
      setContainer({
        ...container,
        probeProperties: {
          ...container.probeProperties,
          probe: {
            ...(container.probeProperties?.probe as ProbeConfig),
            $type,
          },
        } as ProbeProperties,
      });
      if ($type === PROBE_TYPE.HTTP_GET) {
        dispatch({
          type: ValidationActionType.SetField,
          field: 'path',
          isValid: !getPathError(container.probeProperties?.probe?.path as string, t, true),
        });
      }
      dispatch({
        type: ValidationActionType.SetField,
        field: 'port',
        isValid: !getPortError(container.probeProperties?.probe?.port as number, t, true),
      });
    },
    [container, dispatch, setContainer, t],
  );
  useEffect(() => {
    // Initial validation
    if (container.probeProperties?.probe?.$type === PROBE_TYPE.HTTP_GET) {
      dispatch({
        type: ValidationActionType.SetField,
        field: 'path',
        isValid: !getPathError(container.probeProperties?.probe?.path as string, t, true),
      });
    }
    dispatch({
      type: ValidationActionType.SetField,
      field: 'port',
      isValid: !getPortError(container.probeProperties?.probe?.port as number, t, true),
    });
    // Clear up
    return () => {
      dispatch({
        type: ValidationActionType.SetField,
        field: 'path',
        isValid: true,
      });

      dispatch({
        type: ValidationActionType.SetField,
        field: 'port',
        isValid: true,
      });
    };
  }, [
    container.probeProperties?.probe?.$type,
    container.probeProperties?.probe?.path,
    container.probeProperties?.probe?.port,
    dispatch,
    t,
  ]);

  useEffect(() => {
    if (resetCounter || container.probeProperties?.probe?.port) {
      const error = getPortError(container.probeProperties?.probe?.port as number, t, true);
      setPortError(error);
      dispatch({ type: ValidationActionType.SetField, field: 'port', isValid: !error });
    }
  }, [container.probeProperties?.probe?.port, dispatch, resetCounter, t]);

  useEffect(() => {
    if (
      resetCounter ||
      (container.probeProperties?.probe?.path != null && container.probeProperties?.probe?.path.length > 0)
    ) {
      const error = getPathError(container.probeProperties?.probe?.path as string, t);
      setPathError(error);
      dispatch({ type: ValidationActionType.SetField, field: 'path', isValid: !error });
    }
  }, [container.probeProperties?.probe?.path, dispatch, resetCounter, t]);

  return (
    <div className="flex flex-col gap-6">
      <h3>{t(EntityFieldsI18nKey.endpoint)}</h3>
      <div className="flex gap-3">
        <DialSelectField
          id="type"
          disabled={disabled}
          label={t(EntityFieldsI18nKey.type)}
          containerClassName="w-[180px]"
          options={typeOptions}
          value={container.probeProperties?.probe?.$type || typeOptions[0].value}
          onChange={onTypeChange}
        />
        <DialNumberInput
          id="port"
          labelProps={{ label: t(EntityFieldsI18nKey.Port) }}
          placeholder={t(EntityPlaceholdersI18nKey.Port)}
          value={container.probeProperties?.probe?.port}
          onChange={onPortChange}
          disabled={disabled}
          containerClassName="w-[320px]"
          // captionDescription={!portError ? t(EntityCaptionsI18nKey.ProbePort) : ''}
          invalid={!!portError}
          errorText={portError?.text}
        />
        {container.probeProperties?.probe?.$type === PROBE_TYPE.HTTP_GET && (
          <DialInput
            id="path"
            labelProps={{ label: t(EntityFieldsI18nKey.Path) }}
            placeholder={t(EntityPlaceholdersI18nKey.Path)}
            value={container.probeProperties?.probe?.path}
            disabled={disabled}
            containerClassName="w-[320px]"
            onChange={onPathChange}
            // ca={!pathError ? t(EntityCaptionsI18nKey.ProbePath) : ''}
            invalid={!!pathError}
            errorText={pathError?.text}
          />
        )}
      </div>
    </div>
  );
};

export default Endpoint;
