'use client';

import { Input, RadioGroup, RadioGroupOrientation, Select } from '@epam/ai-dial-ui-kit';
import { useEffect, useRef, useState } from 'react';

import {
  getBaseUrlError,
  getPluginName,
  getPluginReference,
  isPluginUrl,
} from '@/src/components/BaseControls/BaseUrlControl/utils';
import { BasicI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';

enum BaseUrlSource {
  Url = 'url',
  Plugin = 'plugin',
}

interface Props {
  id: string;
  label: string;
  value?: string;
  onChange: (value?: string) => void;
  placeholder?: string;
  required?: boolean;
  isReadOnly?: boolean;
  plugins?: string[];
  optionsError?: EntitiesI18nKey;
  containerClassName?: string;
}

const getSource = (value?: string) => (isPluginUrl(value) ? BaseUrlSource.Plugin : BaseUrlSource.Url);

const BaseUrlControl = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
  isReadOnly,
  plugins = [],
  optionsError,
  containerClassName,
}: Props) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const { dispatch, resetCounter } = useSaveValidationContext();
  const [source, setSource] = useState(() => getSource(value));
  const pendingClear = useRef(false);
  const previousReset = useRef(resetCounter);
  const error = getBaseUrlError(value, t, required);
  const isValid = !error;
  const isDisabled = isReadOnly || isReadOnlyAdmin;

  useEffect(() => {
    const isReset = previousReset.current !== resetCounter;
    previousReset.current = resetCounter;
    if (isReset || !pendingClear.current || value) {
      setSource(getSource(value));
    }
    pendingClear.current = false;
  }, [value, resetCounter]);

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: id, isValid });
  }, [dispatch, id, isValid, resetCounter]);

  useEffect(() => () => dispatch({ type: ValidationActionType.RemoveField, field: id }), [dispatch, id]);

  const onChangeSource = (next: string) => {
    if (next === source) return;
    setSource(next as BaseUrlSource);
    pendingClear.current = true;
    onChange(undefined);
  };

  const pluginName = getPluginName(value);
  const selectedPlugin = pluginName ? getPluginReference(pluginName) : value || '';
  const options = [...new Set(plugins)].map((name) => {
    const reference = getPluginReference(name);
    return { value: reference, label: reference };
  });
  if (selectedPlugin && !options.some((option) => option.value === selectedPlugin)) {
    options.push({ value: selectedPlugin, label: selectedPlugin });
  }

  return (
    <div className={containerClassName}>
      {isDisabled ? (
        <Input
          id={id}
          labelProps={{ label, required }}
          value={value || ''}
          error={error?.text}
          invalid={!isValid}
          disabled
        />
      ) : (
        <div className="flex flex-col gap-2">
          <RadioGroup
            id={`${id}-source`}
            labelProps={{ label, required }}
            orientation={RadioGroupOrientation.Row}
            items={[
              { value: BaseUrlSource.Url, label: t(BasicI18nKey.URL) },
              { value: BaseUrlSource.Plugin, label: t(BasicI18nKey.Plugin) },
            ]}
            value={source}
            onChange={onChangeSource}
          />
          {source === BaseUrlSource.Url ? (
            <Input
              id={id}
              labelProps={{ label: t(BasicI18nKey.URL), className: 'sr-only' }}
              placeholder={placeholder}
              value={value || ''}
              error={error?.text}
              invalid={!isValid}
              onChange={(next) => onChange(next?.trimStart() || undefined)}
            />
          ) : (
            <Select
              id={id}
              labelProps={{ label: t(BasicI18nKey.Plugin), className: 'sr-only' }}
              placeholder={t(BasicI18nKey.SelectPlugin)}
              options={options}
              value={selectedPlugin}
              error={error?.text}
              invalid={!isValid}
              onChange={(next) => {
                if (next !== selectedPlugin) onChange(next as string);
              }}
            />
          )}
        </div>
      )}
      {optionsError && (
        <p role="status" aria-live="polite" className="dial-small-text text-secondary">
          {t(optionsError)}
        </p>
      )}
    </div>
  );
};

export default BaseUrlControl;
