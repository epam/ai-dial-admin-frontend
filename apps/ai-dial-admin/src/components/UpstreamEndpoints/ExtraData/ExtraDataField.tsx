import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { DialRadioGroupPopupField, DialTextarea, RadioButtonWithContent } from '@epam/ai-dial-ui-kit';

import JsonEditorBase from '@/src/components/Common/JsonEditorBase/JsonEditorBase';
import { BasicI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey, TypeI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialEndpointExtraData, DialModelEndpoint } from '@/src/models/dial/model';
import { JSONEditorError } from '@/src/types/editor';
import { NONE_ID, USE_JSON_ID, USE_STRING_ID } from './constants';

interface Props {
  endpoint: DialModelEndpoint;
  label?: string;
  disabled?: boolean;
  onChangeExtraData: (extraData: DialEndpointExtraData) => void;
}

const ExtraDataField: FC<Props> = ({ endpoint, disabled, label, onChangeExtraData }) => {
  const t = useI18n();
  const [isValid, setIsValid] = useState(false);
  const [stringValue, setStringValue] = useState<string | undefined>(undefined);
  const [jsonValue, setJsonValue] = useState<string | undefined>(undefined);
  const [isValidJSON, setIsValidJSON] = useState(false);
  const [radioFieldId, setRadioFieldId] = useState(NONE_ID);

  const onSetExtraData = useCallback(
    (extraData: DialEndpointExtraData) => {
      onChangeExtraData(extraData);
    },
    [onChangeExtraData],
  );

  useEffect(() => {
    if (typeof endpoint.extraData === 'object') {
      try {
        setJsonValue(JSON.stringify(endpoint.extraData, null, 2));
        setRadioFieldId(USE_JSON_ID);
      } catch {
        console.error('Invalid JSON');
      }
    } else if (typeof endpoint.extraData === 'number') {
      setStringValue(String(endpoint.extraData));
      setRadioFieldId(USE_STRING_ID);
    } else if (typeof endpoint.extraData === 'string' && endpoint.extraData.length) {
      try {
        const parsed = JSON.parse(endpoint.extraData);

        if (parsed == null) {
          setRadioFieldId(NONE_ID);
        } else if (typeof parsed === 'object') {
          setJsonValue(JSON.stringify(JSON.parse(endpoint.extraData), null, 2));
          setIsValidJSON(true);
          setRadioFieldId(USE_JSON_ID);
        } else {
          setStringValue(endpoint.extraData);
          setRadioFieldId(USE_STRING_ID);
        }
      } catch {
        setStringValue(endpoint.extraData);
        setRadioFieldId(USE_STRING_ID);
      }
    } else {
      setRadioFieldId(NONE_ID);
    }
  }, [endpoint.extraData]);

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
        onSetExtraData('');
        break;
      case USE_STRING_ID:
        onSetExtraData(String(stringValue ?? ''));
        break;
      case USE_JSON_ID:
        onSetExtraData(JSON.parse(jsonValue as string));
        break;
      default:
        break;
    }
  }, [onSetExtraData, radioFieldId, stringValue, jsonValue]);

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

  const customInputValue = useMemo(() => {
    return typeof endpoint.extraData === 'object'
      ? JSON.stringify(endpoint.extraData, null, 2)
      : typeof endpoint.extraData === 'string'
        ? endpoint.extraData
        : typeof endpoint.extraData === 'number'
          ? String(endpoint.extraData)
          : t(BasicI18nKey.None);
  }, [endpoint.extraData, t]);

  return (
    <div className="flex w-[200px] max-w-[200px] shrink-0 flex-col overflow-hidden">
      <DialRadioGroupPopupField
        disabled={disabled}
        htmlFor="extraDataInput"
        id="extraDataInput"
        emptyValueText={t(BasicI18nKey.None)}
        label={label ?? ''}
        header={t(EntityFieldsI18nKey.extraData)}
        portalId="extraDataPortal"
        customInputValue={customInputValue}
        selectedRadioValue={radioFieldId}
        inputClassName="max-w-[200px]"
        valueClassName="w-[180px] truncate pr-2 text-left"
        isValid={isValid}
        radioButtons={radioButtons}
        onChangeRadioField={onChangeRadioField}
        onApply={onApply}
      />
    </div>
  );
};

export default ExtraDataField;
