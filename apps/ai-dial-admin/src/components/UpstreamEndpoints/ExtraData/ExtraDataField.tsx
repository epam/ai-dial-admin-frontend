'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { DialRadioGroupPopupField, DialTextarea, RadioButtonWithContent } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import JsonEditorBase from '@/src/components/Common/JsonEditorBase/JsonEditorBase';
import { BasicI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey, TypeI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialEndpointExtraData } from '@/src/models/dial/model';
import { JSONEditorError } from '@/src/types/editor';
import { NONE_ID, SECRET_VALUE_PLACEHOLDER, USE_JSON_ID, USE_STRING_ID } from './constants';

interface Props {
  value?: DialEndpointExtraData;
  label?: string;
  disabled?: boolean;
  isSecret?: boolean;
  containerClassName?: string;
  onChange: (extraData: DialEndpointExtraData) => void;
}

const ExtraDataField: FC<Props> = ({ value, disabled, label, isSecret, containerClassName, onChange }) => {
  const t = useI18n();
  const [isValid, setIsValid] = useState(false);
  const [stringValue, setStringValue] = useState<string | undefined>(undefined);
  const [jsonValue, setJsonValue] = useState<string | undefined>(undefined);
  const [isValidJSON, setIsValidJSON] = useState(false);
  const [radioFieldId, setRadioFieldId] = useState(NONE_ID);

  useEffect(() => {
    if (typeof value === 'object') {
      try {
        setJsonValue(JSON.stringify(value, null, 2));
        setRadioFieldId(USE_JSON_ID);
      } catch {
        console.error('Invalid JSON');
      }
    } else if (typeof value === 'number') {
      setStringValue(String(value));
      setRadioFieldId(USE_STRING_ID);
    } else if (typeof value === 'string' && value.length) {
      try {
        const parsed = JSON.parse(value);

        if (parsed == null) {
          setRadioFieldId(NONE_ID);
        } else if (typeof parsed === 'object') {
          setJsonValue(JSON.stringify(JSON.parse(value), null, 2));
          setIsValidJSON(true);
          setRadioFieldId(USE_JSON_ID);
        } else {
          setStringValue(value);
          setRadioFieldId(USE_STRING_ID);
        }
      } catch {
        setStringValue(value);
        setRadioFieldId(USE_STRING_ID);
      }
    } else {
      setRadioFieldId(NONE_ID);
    }
  }, [value]);

  useEffect(() => {
    setIsValid(
      radioFieldId === NONE_ID ||
        (radioFieldId === USE_STRING_ID && Boolean(stringValue?.length)) ||
        (radioFieldId === USE_JSON_ID && Boolean(jsonValue) && isValidJSON),
    );
  }, [radioFieldId, stringValue, jsonValue, isValidJSON]);

  const onChangeRadioField = useCallback((id: string) => {
    setRadioFieldId(id);
  }, []);

  const onChangeStringValue = useCallback((v: string) => {
    setStringValue(v);
  }, []);

  const onChangeJsonValue = useCallback((v: string | undefined) => {
    setIsValidJSON(true);
    setJsonValue(v);
  }, []);

  const onValidateJSON = useCallback(
    (errors?: JSONEditorError[]) => {
      setIsValidJSON(!errors?.length);
    },
    [setIsValidJSON],
  );

  const onApply = useCallback(() => {
    switch (radioFieldId) {
      case NONE_ID:
        onChange('');
        break;
      case USE_STRING_ID:
        onChange(String(stringValue ?? ''));
        break;
      case USE_JSON_ID:
        onChange(JSON.parse(jsonValue as string));
        break;
      default:
        break;
    }
  }, [onChange, radioFieldId, stringValue, jsonValue]);

  const radioButtons: RadioButtonWithContent[] = [
    { id: NONE_ID, name: t(BasicI18nKey.None) },
    {
      id: USE_STRING_ID,
      name: t(TypeI18nKey.String),
      content: (
        <DialTextarea
          id="extraDataStringValue"
          value={stringValue}
          placeholder={t(EntityPlaceholdersI18nKey.Value)}
          onChange={onChangeStringValue}
        />
      ),
    },
    {
      id: USE_JSON_ID,
      name: t(TypeI18nKey.JSON),
      content: (
        <div className="h-[540px] max-h-[35vh]">
          <JsonEditorBase value={jsonValue} onChange={onChangeJsonValue} onValidateJSON={onValidateJSON} />
        </div>
      ),
    },
  ];

  const hasValue = useMemo(() => {
    if (typeof value === 'object') {
      return value != null;
    }
    if (typeof value === 'number') {
      return true;
    }

    return typeof value === 'string' && value.length > 0;
  }, [value]);

  // For secret fields we intentionally avoid passing the value through `customInputValue`:
  // the popup field renders `customInputValue` as a real value (with a tooltip), which would
  // expose the secret. Instead we leave it empty and rely on `emptyValueText` to show a fixed
  // mask placeholder that signals "a secret value is set" without revealing it.
  const customInputValue = useMemo(() => {
    if (isSecret) {
      return undefined;
    }

    return typeof value === 'object'
      ? JSON.stringify(value, null, 2)
      : typeof value === 'string'
        ? value
        : typeof value === 'number'
          ? String(value)
          : undefined;
  }, [value, isSecret]);

  const emptyValueText = isSecret && hasValue ? SECRET_VALUE_PLACEHOLDER : t(BasicI18nKey.None);

  const isFlexible = Boolean(containerClassName);

  return (
    <div
      className={classNames('flex flex-col overflow-hidden', containerClassName ?? 'w-[200px] max-w-[200px] shrink-0')}
    >
      <DialRadioGroupPopupField
        disabled={disabled}
        htmlFor="extraDataInput"
        id="extraDataInput"
        placeholder={emptyValueText}
        label={label ?? ''}
        header={t(EntityFieldsI18nKey.extraData)}
        portalId="extraDataPortal"
        customInputValue={customInputValue}
        selectedRadioValue={radioFieldId}
        inputClassName={isFlexible ? 'w-full' : 'max-w-[200px]'}
        valueClassName={isFlexible ? 'w-full truncate pr-2 text-left' : 'w-[180px] truncate pr-2 text-left'}
        isValid={isValid}
        radioButtons={radioButtons}
        onChangeRadioField={onChangeRadioField}
        onApply={onApply}
      />
    </div>
  );
};

export default ExtraDataField;
