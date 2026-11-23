'use client';

import { useCallback, useEffect } from 'react';

import { Input, Select } from '@epam/ai-dial-ui-kit';

import BaseUrlControl from '@/src/components/BaseControls/BaseUrlControl/BaseUrlControl';
import { isPluginUrl } from '@/src/components/BaseControls/BaseUrlControl/utils';
import InterfaceDefaultsButton from '@/src/components/BaseControls/InterfacesField/InterfaceDefaultsButton';
import InterfaceFeaturesButton from '@/src/components/BaseControls/InterfacesField/InterfaceFeaturesButton';
import {
  BaseUrlInterfaceValue,
  BaseUrlKey,
  DefaultHeadersKey,
} from '@/src/components/BaseControls/InterfacesField/models';
import OverridePathsField from '@/src/components/BaseControls/InterfacesField/OverridePathsField';
import TranslatorField from '@/src/components/BaseControls/InterfacesField/TranslatorField';
import KeyValueGrid from '@/src/components/Common/KeyValueGrid/KeyValueGrid';
import { EntityFieldsI18nKey, InterfacesI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DeploymentInterfaceType, InterfaceMode, TranslatorReference } from '@/src/models/dial/interfaces';
import { FieldError } from '@/src/models/error';
import type { PluginOptions } from '@/src/server/config-entities/read-plugin-options';
import type { ResourceInfo } from '@/src/server/core/asset-metadata';
import { ApplicationRoute } from '@/src/types/routes';
import { getUrlError } from '@/src/utils/validation/url-error';
import RemoveButton from '@/src/components/Common/RemoveButton/RemoveButton';

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
  view?: ApplicationRoute;
  // isAsset gates the mode/translator/headers/Defaults/Features richness this change adds — scoped to
  // Assets → Models and Assets → Applications only (see deployment-interfaces-config's "Interface mode
  // selector" requirement). Other InterfacesField consumers (entity Models/Applications, Interceptors)
  // render exactly as before.
  isAsset?: boolean;
  translators?: ResourceInfo[];
  isPluginEnabled?: boolean;
  plugins?: PluginOptions;
  // The entity-level base URL Core's passthroughBaseUrl falls back to when this row's base URL is
  // empty, making the row's own value optional. Absent on surfaces with no such field (entity
  // Models/Applications/Interceptors, platform Interceptors), where the row stays unconditionally
  // required.
  entityBaseUrl?: string;
  // Offers only Passthrough: the owning entity cannot serve this interface through a translator.
  isTranslatorDisabled?: boolean;
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
  isPluginEnabled,
  plugins,
  entityBaseUrl,
  isTranslatorDisabled,
  view,
}: Props<V>) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();

  const baseUrl = value[baseUrlKey] || '';
  const effectiveMode = value.mode ?? InterfaceMode.Passthrough;
  const isPassthrough = !isAsset || effectiveMode === InterfaceMode.Passthrough;
  const isRequired = !entityBaseUrl;
  const baseUrlValidationField = `${fieldId}-base-url`;
  const translatorValidationField = `${fieldId}-translator`;
  const overridePathsValidationField = `${fieldId}-plugin-override-paths`;
  const hasPluginOverrideConflict =
    !!isPluginEnabled &&
    isPassthrough &&
    isPluginUrl(baseUrl || entityBaseUrl) &&
    !!Object.keys(value.overridePaths || {}).length;

  // The plugin-aware control owns its own validation when enabled.
  const error: FieldError | null = isPassthrough && !isPluginEnabled ? getUrlError(baseUrl, t, isRequired) : null;
  const isBaseUrlValid = !error;
  const hasTranslator = !!value.translator;

  // Validity is a pure function of the row's props, so one effect keeps the context in sync. A mode
  // switch (a router moved to decision mode drops its translators) only changes those props. It also
  // re-runs on `resetCounter`, because a validation reset clears every registered field.
  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: baseUrlValidationField, isValid: isBaseUrlValid });
    dispatch({
      type: ValidationActionType.SetField,
      field: overridePathsValidationField,
      isValid: !hasPluginOverrideConflict,
    });
    dispatch({
      type: ValidationActionType.SetField,
      field: translatorValidationField,
      isValid: isPassthrough || hasTranslator,
    });
  }, [
    baseUrlValidationField,
    dispatch,
    hasTranslator,
    hasPluginOverrideConflict,
    isBaseUrlValid,
    isPassthrough,
    overridePathsValidationField,
    resetCounter,
    translatorValidationField,
  ]);

  useEffect(
    () => () => {
      dispatch({ type: ValidationActionType.RemoveField, field: baseUrlValidationField });
      dispatch({ type: ValidationActionType.RemoveField, field: translatorValidationField });
      dispatch({ type: ValidationActionType.RemoveField, field: overridePathsValidationField });
    },
    [baseUrlValidationField, dispatch, overridePathsValidationField, translatorValidationField],
  );

  const onChangeBaseUrl = useCallback(
    (newValue?: string) => {
      const trimmedValue = newValue?.trimStart() || undefined;
      // undefined, never '': Core treats an empty-string base_url as a present, broken URL rather
      // than an absent one, so an emptied value must be omitted from the payload.
      onChange({ ...value, [baseUrlKey]: trimmedValue });
    },
    [value, baseUrlKey, onChange],
  );

  // base_url and translator are mutually exclusive on the wire (Core's DeploymentInterface carries
  // one or the other), so switching mode drops whichever field the new mode doesn't use.
  // overridePaths is dropped with base_url: Core rejects it on a translated interface.
  const onChangeMode = useCallback(
    (mode: InterfaceMode) => {
      if (mode === InterfaceMode.Translator) {
        onChange({ ...value, mode, [baseUrlKey]: undefined, overridePaths: undefined });
      } else {
        onChange({ ...value, mode, translator: undefined });
      }
    },
    [baseUrlKey, onChange, value],
  );

  const onChangeTranslator = useCallback(
    (translator: TranslatorReference) => onChange({ ...value, translator }),
    [onChange, value],
  );

  const onChangeDefaultHeaders = useCallback(
    (headers: Record<string, string>) => onChange({ ...value, [defaultHeadersKey]: headers }),
    [value, defaultHeadersKey, onChange],
  );

  const onChangeOverridePaths = useCallback(
    (overridePaths?: Record<string, string>) => onChange({ ...value, overridePaths }),
    [value, onChange],
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
    ...(isTranslatorDisabled ? [] : [{ value: InterfaceMode.Translator, label: t(InterfacesI18nKey.ModeTranslator) }]),
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
          {view !== ApplicationRoute.PlatformInterceptors && (
            <InterfaceFeaturesButton
              fieldId={fieldId}
              features={value.features}
              disabled={disabled}
              onChange={onChangeFeatures}
              view={view}
            />
          )}
        </div>
        {!disabled && <RemoveButton onClick={onDelete} />}
      </div>

      {isAsset && (
        <Select
          id={`${fieldId}-mode`}
          labelProps={{ label: t(InterfacesI18nKey.Mode) }}
          caption={isTranslatorDisabled ? t(InterfacesI18nKey.InfoDecisionMode) : undefined}
          className="max-w-[300px]"
          options={modeOptions}
          value={effectiveMode}
          disabled={disabled}
          onChange={(newValue) => onChangeMode(newValue as InterfaceMode)}
        />
      )}

      <div className="flex items-start gap-x-2">
        {isPassthrough && isPluginEnabled && (
          <BaseUrlControl
            id={fieldId}
            label={t(InterfacesI18nKey.BaseUrl)}
            placeholder={t(InterfacesI18nKey.BaseUrlPlaceholder, { type: typeLabel })}
            value={baseUrl}
            onChange={onChangeBaseUrl}
            required={isRequired}
            isReadOnly={disabled}
            plugins={plugins?.options}
            optionsError={plugins?.error}
            containerClassName="w-full"
          />
        )}
        {isPassthrough && !isPluginEnabled && (
          <Input
            id={fieldId}
            labelProps={{ label: t(InterfacesI18nKey.BaseUrl), required: isRequired }}
            placeholder={t(InterfacesI18nKey.BaseUrlPlaceholder, { type: typeLabel })}
            value={baseUrl}
            onChange={onChangeBaseUrl}
            disabled={disabled}
            error={error?.text}
            invalid={!isBaseUrlValid}
            containerClassName="w-full"
          />
        )}
        {!isPassthrough && (
          <TranslatorField
            fieldId={fieldId}
            type={type}
            translator={value.translator}
            translators={translators || []}
            plugins={plugins}
            isPluginEnabled={isPluginEnabled}
            disabled={disabled}
            onChange={onChangeTranslator}
          />
        )}
      </div>

      {hasPluginOverrideConflict && (
        <p role="alert" className="text-error dial-small-text">
          {t(InterfacesI18nKey.PluginOverridePathsError)}
        </p>
      )}

      {isAsset && isPassthrough && (
        <OverridePathsField
          fieldId={fieldId}
          type={type}
          value={value.overridePaths}
          disabled={disabled}
          onChange={onChangeOverridePaths}
        />
      )}

      {isAsset && (
        <KeyValueGrid
          label={t(EntityFieldsI18nKey.defaultHeaders)}
          value={value[defaultHeadersKey]}
          disabled={disabled}
          onChange={onChangeDefaultHeaders}
        />
      )}
    </div>
  );
};

export default InterfaceRow;
