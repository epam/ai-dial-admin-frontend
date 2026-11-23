'use client';

import { FC, useCallback, useEffect, useState } from 'react';

import { Input, Switch } from '@epam/ai-dial-ui-kit';

import {
  DECISION_MAX_DECISIONS_FIELD,
  DECISION_TIMEOUT_FIELD,
} from '@/src/components/Assets/Platform/Routers/constants';
import {
  compactDecision,
  isValidMaxDecisions,
  isValidTimeoutMs,
  parseDecisionNumber,
} from '@/src/components/Assets/Platform/Routers/utils';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { RouterDecision } from '@/src/models/dial/router';

interface Props {
  decision?: RouterDecision;
  disabled?: boolean;
  onChange: (decision?: RouterDecision) => void;
}

/**
 * The decide request's settings, shown in decision mode only. An empty field is absent, which Core reads
 * as its default (5000 ms, 3 decisions, no body), so the defaults are placeholders rather than values.
 */
const DecisionSettings: FC<Props> = ({ decision, disabled, onChange }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const { dispatch } = useSaveValidationContext();
  const isReadonly = disabled || isReadOnlyAdmin;

  const [timeoutText, setTimeoutText] = useState(decision?.timeoutMs?.toString() ?? '');
  const [maxDecisionsText, setMaxDecisionsText] = useState(decision?.maxDecisions?.toString() ?? '');

  const isTimeoutValid = isValidTimeoutMs(parseDecisionNumber(timeoutText));
  const isMaxDecisionsValid = isValidMaxDecisions(parseDecisionNumber(maxDecisionsText));

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: DECISION_TIMEOUT_FIELD, isValid: isTimeoutValid });
  }, [dispatch, isTimeoutValid]);

  useEffect(() => {
    dispatch({
      type: ValidationActionType.SetField,
      field: DECISION_MAX_DECISIONS_FIELD,
      isValid: isMaxDecisionsValid,
    });
  }, [dispatch, isMaxDecisionsValid]);

  useEffect(
    () => () => {
      dispatch({ type: ValidationActionType.RemoveField, field: DECISION_TIMEOUT_FIELD });
      dispatch({ type: ValidationActionType.RemoveField, field: DECISION_MAX_DECISIONS_FIELD });
    },
    [dispatch],
  );

  const onChangeBody = useCallback(
    (body: boolean) => onChange(compactDecision({ ...decision, body: body || undefined })),
    [decision, onChange],
  );

  const onChangeTimeout = useCallback(
    (value?: string) => {
      setTimeoutText(value ?? '');
      const timeoutMs = parseDecisionNumber(value);
      onChange(compactDecision({ ...decision, timeoutMs: Number.isNaN(timeoutMs) ? undefined : timeoutMs }));
    },
    [decision, onChange],
  );

  const onChangeMaxDecisions = useCallback(
    (value?: string) => {
      setMaxDecisionsText(value ?? '');
      const maxDecisions = parseDecisionNumber(value);
      onChange(compactDecision({ ...decision, maxDecisions: Number.isNaN(maxDecisions) ? undefined : maxDecisions }));
    },
    [decision, onChange],
  );

  return (
    <div className="flex flex-col gap-y-8">
      <div className="relative">
        <Switch
          id="routerDecisionBody"
          isOn={!!decision?.body}
          disabled={isReadonly}
          labelProps={{ label: t(EntityFieldsI18nKey.routerDecisionBody) }}
          onChange={onChangeBody}
        />
      </div>
      <Input
        id="routerDecisionTimeoutMs"
        type="number"
        labelProps={{ label: t(EntityFieldsI18nKey.routerDecisionTimeoutMs) }}
        placeholder={t(EntityFieldsI18nKey.routerDecisionTimeoutMsPlaceholder)}
        value={timeoutText}
        disabled={isReadonly}
        invalid={!isTimeoutValid}
        error={isTimeoutValid ? undefined : t(EntityFieldsI18nKey.routerDecisionTimeoutMsError)}
        containerClassName="w-[220px]"
        onChange={onChangeTimeout}
      />
      <Input
        id="routerDecisionMaxDecisions"
        type="number"
        labelProps={{ label: t(EntityFieldsI18nKey.routerDecisionMaxDecisions) }}
        placeholder={t(EntityFieldsI18nKey.routerDecisionMaxDecisionsPlaceholder)}
        value={maxDecisionsText}
        disabled={isReadonly}
        invalid={!isMaxDecisionsValid}
        error={isMaxDecisionsValid ? undefined : t(EntityFieldsI18nKey.routerDecisionMaxDecisionsError)}
        containerClassName="w-[220px]"
        onChange={onChangeMaxDecisions}
      />
    </div>
  );
};

export default DecisionSettings;
