'use client';

import { useCallback, useEffect, useState } from 'react';

import { DialInput, DialPasswordInput, DialRemoveButton } from '@epam/ai-dial-ui-kit';

import ExtraDataField from '@/src/components/UpstreamEndpoints/ExtraData/ExtraDataField';
import {
  ButtonsI18nKey,
  EntityFieldsI18nKey,
  EntityPlaceholdersI18nKey,
  UpstreamEndpointsI18nKey,
} from '@/src/constants/i18n';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialUpstreamInterface } from '@/src/models/dial/model';
import { FieldError } from '@/src/models/error';
import { getUrlError } from '@/src/utils/validation/url-error';

interface Props {
  fieldId: string;
  typeLabel: string;
  value: DialUpstreamInterface;
  disabled?: boolean;
  onChange: (value: DialUpstreamInterface) => void;
  onDelete: () => void;
}

// Peer of InterfaceRow for InterfaceFieldVariant.Endpoint: an upstream overrides an interface with its
// own endpoint/key/extraData rather than one base_url. `endpoint` is optional here — absent, DIAL Core
// falls back to the upstream's own baseUrl for this interface — so it validates only when non-empty.
const InterfaceEndpointRow = ({ fieldId, typeLabel, value, disabled, onChange, onDelete }: Props) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();
  const [error, setError] = useState<FieldError | null>(null);

  const validate = useCallback(
    (endpoint?: string, shouldShowError = true) => {
      const urlError = getUrlError(endpoint, t, false);
      dispatch({ type: ValidationActionType.SetField, field: fieldId, isValid: !urlError });
      if (shouldShowError) {
        setError(urlError);
      }
    },
    [dispatch, fieldId, t],
  );

  useEffect(() => {
    validate(value.endpoint, false);

    return () => {
      dispatch({ type: ValidationActionType.RemoveField, field: fieldId });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resetCounter) {
      validate(value.endpoint);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetCounter]);

  const onChangeEndpoint = useCallback(
    (newValue?: string) => {
      const trimmedValue = newValue?.trimStart() || '';
      validate(trimmedValue);
      onChange({ ...value, endpoint: trimmedValue });
    },
    [value, onChange, validate],
  );

  return (
    <div className="flex flex-col gap-y-2">
      <p className="dial-body-text font-semibold text-primary">{typeLabel}</p>
      <div className="flex flex-row flex-1 gap-x-2">
        <div className="flex flex-col flex-1 gap-y-2">
          <div className="flex flex-row gap-x-2">
            <DialInput
              id={fieldId}
              labelProps={{ label: t(EntityFieldsI18nKey.endpoint) }}
              placeholder={t(EntityPlaceholdersI18nKey.UpstreamEndpoint)}
              value={value.endpoint || ''}
              onChange={onChangeEndpoint}
              disabled={disabled}
              error={error?.text}
              invalid={!!error}
              containerClassName={STANDARD_CONTROL_WIDTH}
            />
            <DialPasswordInput
              id={`${fieldId}-key`}
              labelProps={{ label: t(UpstreamEndpointsI18nKey.Keys) }}
              placeholder={t(EntityPlaceholdersI18nKey.UpstreamKey)}
              value={value.key}
              onChange={(key?: string) => onChange({ ...value, key })}
              disabled={disabled}
              containerClassName="flex-1"
            />
          </div>
          <div className="flex flex-row gap-x-2 w-full">
            <ExtraDataField
              label={t(EntityFieldsI18nKey.extraData)}
              value={value.extraData}
              disabled={disabled}
              containerClassName="flex-1 min-w-0"
              onChange={(extraData) => onChange({ ...value, extraData })}
            />
            <ExtraDataField
              label={t(EntityFieldsI18nKey.secretExtraData)}
              value={value.secretExtraData}
              disabled={disabled}
              isSecret
              containerClassName="flex-1 min-w-0"
              onChange={(secretExtraData) => onChange({ ...value, secretExtraData })}
            />
          </div>
        </div>
        {!disabled && <DialRemoveButton aria-label={t(ButtonsI18nKey.Delete)} onClick={onDelete} className="mt-7" />}
      </div>
    </div>
  );
};

export default InterfaceEndpointRow;
