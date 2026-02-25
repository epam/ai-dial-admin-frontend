import { FC, useCallback, useEffect, useState } from 'react';
import { DialNumberInput } from '@epam/ai-dial-ui-kit';

import { Container, ProbeProperties } from '@/src/models/deployments/containers';
import { EntityCaptionsI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { FieldError } from '@/src/models/error';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getAdvancedTimingsError } from '@/src/utils/deployments/validation';
import { useI18n } from '@/src/locales/client';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
  disabled?: boolean;
}

const MAX_INITIAL_DELAY_SEC = 6000;
const MAX_PERIOD_SEC = 600;
const MAX_TIMEOUT_SEC = 12000;
const MAX_FAILURE_THRESHOLD = 100;

const AdvancedTiming: FC<Props> = ({ container, setContainer, disabled }) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();

  const [initialDelaySecondsError, setInitialDelaySecondsError] = useState<FieldError | null>(null);
  const [periodSecondsError, setPeriodSecondsError] = useState<FieldError | null>(null);
  const [timeoutSecondsError, setTimeoutSecondsError] = useState<FieldError | null>(null);
  const [failureThresholdError, setFailureThresholdError] = useState<FieldError | null>(null);

  const onInitialDelaySecondsChange = useCallback(
    (initialDelaySeconds?: string | number) => {
      const error = getAdvancedTimingsError(initialDelaySeconds as number, t, MAX_INITIAL_DELAY_SEC);
      setInitialDelaySecondsError(error);
      dispatch({ type: ValidationActionType.SetField, field: 'initialDelaySeconds', isValid: !error });

      setContainer({
        ...container,
        probeProperties: {
          ...container.probeProperties,
          initialDelaySeconds: initialDelaySeconds,
        } as ProbeProperties,
      });
    },
    [container, dispatch, setContainer, t],
  );

  const onPeriodSecondsChange = useCallback(
    (periodSeconds?: string | number) => {
      const error = getAdvancedTimingsError(periodSeconds as number, t, MAX_PERIOD_SEC);
      setPeriodSecondsError(error);
      dispatch({ type: ValidationActionType.SetField, field: 'periodSeconds', isValid: !error });

      setContainer({
        ...container,
        probeProperties: {
          ...container.probeProperties,
          periodSeconds: periodSeconds,
        } as ProbeProperties,
      });
    },
    [container, dispatch, setContainer, t],
  );

  const onTimeoutSecondsChange = useCallback(
    (timeoutSeconds?: string | number) => {
      const error = getAdvancedTimingsError(timeoutSeconds as number, t, MAX_TIMEOUT_SEC);
      setTimeoutSecondsError(error);
      dispatch({ type: ValidationActionType.SetField, field: 'timeoutSeconds', isValid: !error });

      setContainer({
        ...container,
        probeProperties: {
          ...container.probeProperties,
          timeoutSeconds,
        } as ProbeProperties,
      });
    },
    [container, dispatch, setContainer, t],
  );

  const onFailureThresholdChange = useCallback(
    (failureThreshold?: string | number) => {
      const error = getAdvancedTimingsError(failureThreshold as number, t, MAX_FAILURE_THRESHOLD);
      setFailureThresholdError(error);
      dispatch({ type: ValidationActionType.SetField, field: 'failureThreshold', isValid: !error });

      setContainer({
        ...container,
        probeProperties: {
          ...container.probeProperties,
          failureThreshold,
        } as ProbeProperties,
      });
    },
    [container, dispatch, setContainer, t],
  );

  useEffect(() => {
    const { initialDelaySeconds, periodSeconds, timeoutSeconds, failureThreshold } =
      container.probeProperties as ProbeProperties;
    dispatch({
      type: ValidationActionType.SetField,
      field: 'initialDelaySeconds',
      isValid: !getAdvancedTimingsError(initialDelaySeconds as number, t, MAX_INITIAL_DELAY_SEC),
    });
    dispatch({
      type: ValidationActionType.SetField,
      field: 'periodSeconds',
      isValid: !getAdvancedTimingsError(periodSeconds as number, t, MAX_PERIOD_SEC),
    });
    dispatch({
      type: ValidationActionType.SetField,
      field: 'timeoutSeconds',
      isValid: !getAdvancedTimingsError(timeoutSeconds as number, t, MAX_TIMEOUT_SEC),
    });
    dispatch({
      type: ValidationActionType.SetField,
      field: 'failureThreshold',
      isValid: !getAdvancedTimingsError(failureThreshold as number, t, MAX_FAILURE_THRESHOLD),
    });

    return () => {
      dispatch({
        type: ValidationActionType.SetField,
        field: 'initialDelaySeconds',
        isValid: true,
      });
      dispatch({
        type: ValidationActionType.SetField,
        field: 'periodSeconds',
        isValid: true,
      });
      dispatch({
        type: ValidationActionType.SetField,
        field: 'timeoutSeconds',
        isValid: true,
      });
      dispatch({
        type: ValidationActionType.SetField,
        field: 'failureThreshold',
        isValid: true,
      });
    };
  }, [container.probeProperties, dispatch, t]);

  useEffect(() => {
    const { initialDelaySeconds } = container.probeProperties as ProbeProperties;
    if (resetCounter || initialDelaySeconds !== void 0) {
      const error = getAdvancedTimingsError(initialDelaySeconds as number, t, MAX_INITIAL_DELAY_SEC);
      setInitialDelaySecondsError(error);
      dispatch({ type: ValidationActionType.SetField, field: 'initialDelaySeconds', isValid: !error });
    }
  }, [container.probeProperties, dispatch, resetCounter, t]);

  useEffect(() => {
    const { periodSeconds } = container.probeProperties as ProbeProperties;
    if (resetCounter || periodSeconds !== void 0) {
      const error = getAdvancedTimingsError(periodSeconds as number, t, MAX_PERIOD_SEC);
      setPeriodSecondsError(error);
      dispatch({ type: ValidationActionType.SetField, field: 'periodSeconds', isValid: !error });
    }
  }, [container.probeProperties, dispatch, resetCounter, t]);

  useEffect(() => {
    const { timeoutSeconds } = container.probeProperties as ProbeProperties;
    if (resetCounter || timeoutSeconds !== void 0) {
      const error = getAdvancedTimingsError(timeoutSeconds as number, t, MAX_TIMEOUT_SEC);
      setTimeoutSecondsError(error);
      dispatch({ type: ValidationActionType.SetField, field: 'timeoutSeconds', isValid: !error });
    }
  }, [container.probeProperties, dispatch, resetCounter, t]);

  useEffect(() => {
    const { failureThreshold } = container.probeProperties as ProbeProperties;
    if (resetCounter || failureThreshold !== void 0) {
      const error = getAdvancedTimingsError(failureThreshold as number, t, MAX_FAILURE_THRESHOLD);
      setFailureThresholdError(error);
      dispatch({ type: ValidationActionType.SetField, field: 'failureThreshold', isValid: !error });
    }
  }, [container.probeProperties, dispatch, resetCounter, t]);

  return (
    <div className="flex flex-col gap-6">
      <h3>{t(EntityFieldsI18nKey.AdvancedTiming)}</h3>
      <DialNumberInput
        id="initialDelaySeconds"
        labelProps={{
          label: t(EntityFieldsI18nKey.InitialDelaySeconds),
          caption: !initialDelaySecondsError ? t(EntityCaptionsI18nKey.ProbeInitialDelaySeconds) : '',
        }}
        placeholder={t(EntityPlaceholdersI18nKey.InitialDelaySeconds)}
        value={container.probeProperties?.initialDelaySeconds}
        onChange={onInitialDelaySecondsChange}
        disabled={disabled}
        containerClassName="w-[320px]"
        invalid={!!initialDelaySecondsError}
        errorText={initialDelaySecondsError?.text}
      />
      <DialNumberInput
        id="periodSeconds"
        labelProps={{
          label: t(EntityFieldsI18nKey.PeriodSeconds),
          caption: !periodSecondsError ? t(EntityCaptionsI18nKey.ProbePeriodSeconds) : '',
        }}
        placeholder={t(EntityPlaceholdersI18nKey.PeriodSeconds)}
        value={container.probeProperties?.periodSeconds}
        onChange={onPeriodSecondsChange}
        disabled={disabled}
        containerClassName="w-[320px]"
        invalid={!!periodSecondsError}
        errorText={periodSecondsError?.text}
      />
      <DialNumberInput
        id="timeoutSeconds"
        labelProps={{
          label: t(EntityFieldsI18nKey.TimeoutSeconds),
          caption: !timeoutSecondsError ? t(EntityCaptionsI18nKey.ProbeTimeoutSeconds) : '',
        }}
        placeholder={t(EntityPlaceholdersI18nKey.TimeoutSeconds)}
        value={container.probeProperties?.timeoutSeconds}
        onChange={onTimeoutSecondsChange}
        disabled={disabled}
        containerClassName="w-[320px]"
        invalid={!!timeoutSecondsError}
        errorText={timeoutSecondsError?.text}
      />
      <DialNumberInput
        id="failureThreshold"
        labelProps={{
          label: t(EntityFieldsI18nKey.FailureThreshold),
          caption: !failureThresholdError ? t(EntityCaptionsI18nKey.ProbeFailuresThreshold) : '',
        }}
        placeholder={t(EntityPlaceholdersI18nKey.FailureThreshold)}
        value={container.probeProperties?.failureThreshold}
        onChange={onFailureThresholdChange}
        disabled={disabled}
        containerClassName="w-[320px]"
        invalid={!!failureThresholdError}
        errorText={failureThresholdError?.text}
      />
    </div>
  );
};

export default AdvancedTiming;
