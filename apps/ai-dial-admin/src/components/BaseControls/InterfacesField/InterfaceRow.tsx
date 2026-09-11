'use client';

import { useCallback, useEffect, useState } from 'react';

import { DialInput, DialRemoveButton, DialSelectField } from '@epam/ai-dial-ui-kit';

import InterfaceDefaultsButton from '@/src/components/BaseControls/InterfacesField/InterfaceDefaultsButton';
import InterfaceFeaturesButton from '@/src/components/BaseControls/InterfacesField/InterfaceFeaturesButton';
import {
  BaseUrlInterfaceValue,
  BaseUrlKey,
  DefaultHeadersKey,
} from '@/src/components/BaseControls/InterfacesField/models';
import TranslatorField from '@/src/components/BaseControls/InterfacesField/TranslatorField';
import KeyValueGrid from '@/src/components/Common/KeyValueGrid/KeyValueGrid';
import { ButtonsI18nKey, EntityFieldsI18nKey, InterfacesI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DeploymentInterfaceType, InterfaceMode, TranslatorReference } from '@/src/models/dial/interfaces';
import { FieldError } from '@/src/models/error';
import type { ResourceInfo } from '@/src/server/core/asset-metadata';
import { getUrlError } from '@/src/utils/validation/url-error';

interface Props<V extends BaseUrlInterfaceValue = BaseUrlInterfaceValue> {
  fieldId: string;
  type: DeploymentInterfaceType;
  typeLabel: string;
  value: V;
  baseUrlKey: BaseUrlKey;
  defaultHeadersKey: DefaultHeadersKey;
  disabled?: boolean;
  onChange: (value: V) => void;
  onDelete: () => void;
  // isAsset gates the mode/translator/headers/Defaults/Features richness this change adds — scoped to
  // Assets → Models and Assets → Applications only (see deployment-interfaces-config's "Interface mode
  // selector" requirement). Other InterfacesField consumers (entity Models/Applications, Interceptors)
  // render exactly as before.
  isAsset?: boolean;
  translators?: ResourceInfo[];
}

const InterfaceRow = <V extends BaseUrlInterfaceValue = BaseUrlInterfaceValue>({
  fieldId,
  type,
  typeLabel,
  value,
  baseUrlKey,
  defaultHeadersKey,
  disabled,
  onChange,
  onDelete,
  isAsset,
  translators,
}: Props<V>) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();
  const [error, setError] = useState<FieldError | null>(null);

  const baseUrl = value[baseUrlKey] || '';
  const effectiveMode = value.mode ?? InterfaceMode.Passthrough;
  const isPassthrough = !isAsset || effectiveMode === InterfaceMode.Passthrough;

  const validate = useCallback(
    (url?: string, shouldShowError = true) => {
      const urlError = getUrlError(url, t, true);
      dispatch({ type: ValidationActionType.SetField, field: fieldId, isValid: !urlError });
      if (shouldShowError) {
        setError(urlError);
      }
    },
    [dispatch, fieldId, t],
  );

  useEffect(() => {
    if (isPassthrough) {
      validate(baseUrl, false);
    }

    return () => {
      dispatch({ type: ValidationActionType.RemoveField, field: fieldId });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resetCounter && isPassthrough) {
      validate(baseUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetCounter]);

  const onChangeBaseUrl = useCallback(
    (newValue?: string) => {
      const trimmedValue = newValue?.trimStart() || '';
      validate(trimmedValue);
      onChange({ ...value, [baseUrlKey]: trimmedValue });
    },
    [value, baseUrlKey, onChange, validate],
  );

  // base_url and translator are mutually exclusive on the wire (Core's DeploymentInterface carries
  // one or the other), so switching mode drops whichever field the new mode doesn't use.
  const onChangeMode = useCallback(
    (mode: InterfaceMode) => {
      if (mode === InterfaceMode.Translator) {
        onChange({ ...value, mode, [baseUrlKey]: undefined });
      } else {
        onChange({ ...value, mode, translator: undefined });
      }
    },
    [value, baseUrlKey, onChange],
  );

  const onChangeTranslator = useCallback(
    (translator: TranslatorReference) => onChange({ ...value, translator }),
    [value, onChange],
  );

  const onChangeDefaultHeaders = useCallback(
    (headers: Record<string, string>) => onChange({ ...value, [defaultHeadersKey]: headers }),
    [value, defaultHeadersKey, onChange],
  );

  const onChangeDefaults = useCallback(
    (defaults: Record<string, unknown>) => onChange({ ...value, defaults }),
    [value, onChange],
  );

  const onChangeFeatures = useCallback(
    (features: Record<string, unknown>) => onChange({ ...value, features }),
    [value, onChange],
  );

  const modeOptions = [
    { value: InterfaceMode.Passthrough, label: t(InterfacesI18nKey.ModePassthrough) },
    { value: InterfaceMode.Translator, label: t(InterfacesI18nKey.ModeTranslator) },
  ];

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center gap-x-2">
        <p className="flex-1 dial-body-text font-semibold text-primary">{typeLabel}</p>
        <div className="flex items-center gap-x-2">
          <InterfaceDefaultsButton
            fieldId={fieldId}
            value={value.defaults}
            disabled={disabled}
            onChange={onChangeDefaults}
          />
          <InterfaceFeaturesButton
            fieldId={fieldId}
            features={value.features}
            disabled={disabled}
            onChange={onChangeFeatures}
          />
        </div>
        {!disabled && <DialRemoveButton aria-label={t(ButtonsI18nKey.Delete)} onClick={onDelete} />}
      </div>

      {isAsset && (
        <DialSelectField
          id={`${fieldId}-mode`}
          label={t(InterfacesI18nKey.Mode)}
          containerClassName="max-w-[300px]"
          options={modeOptions}
          value={effectiveMode}
          disabled={disabled}
          onChange={(newValue) => onChangeMode(newValue as InterfaceMode)}
        />
      )}

      <div className="flex items-start gap-x-2">
        {isPassthrough ? (
          <DialInput
            id={fieldId}
            labelProps={{ label: t(InterfacesI18nKey.BaseUrl), required: true }}
            placeholder={t(InterfacesI18nKey.BaseUrlPlaceholder, { type: typeLabel })}
            value={baseUrl}
            onChange={onChangeBaseUrl}
            disabled={disabled}
            error={error?.text}
            invalid={!!error}
            containerClassName="w-full"
          />
        ) : (
          <TranslatorField
            fieldId={fieldId}
            type={type}
            translator={value.translator}
            translators={translators || []}
            disabled={disabled}
            onChange={onChangeTranslator}
          />
        )}
      </div>

      {isAsset && (
        <>
          <KeyValueGrid
            label={t(EntityFieldsI18nKey.defaultHeaders)}
            value={value[defaultHeadersKey]}
            disabled={disabled}
            onChange={onChangeDefaultHeaders}
          />
        </>
      )}
    </div>
  );
};

export default InterfaceRow;
