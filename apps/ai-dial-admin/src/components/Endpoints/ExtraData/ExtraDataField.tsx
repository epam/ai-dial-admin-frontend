import JsonEditorBase from '@/src/components/Common/JsonEditorBase/JsonEditorBase';
import { RadioButtonWithContent } from '@/src/components/Common/RadioGroup/RadioGroup';
import RadioGroupModalField from '@/src/components/Common/RadioGroupModalField/RadioGroupModalField';
import TextAreaField from '@/src/components/Common/TextAreaField/TextAreaField';
import { BasicI18nKey, UpstreamEndpointsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialEndpointExtraData, DialModelEndpoint } from '@/src/models/dial/model';
import { JSONEditorError } from '@/src/types/editor';
import { FC, useCallback, useEffect, useState } from 'react';
import { NONE_ID, USE_JSON_ID, USE_STRING_ID } from './extra-data';

interface Props {
  endpoint: DialModelEndpoint;
  fieldTitle?: string;
  onChangeExtraData: (extraData: DialEndpointExtraData) => void;
}

const ExtraDataField: FC<Props> = ({ endpoint, fieldTitle, onChangeExtraData }) => {
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
        onSetExtraData(stringValue as string);
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
      name: t(UpstreamEndpointsI18nKey.ExtraDataString),
      content: (
        <TextAreaField
          elementId="extraDataStringValue"
          value={stringValue}
          placeholder={t(UpstreamEndpointsI18nKey.ExtraDataStringPlaceholder)}
          onChange={onChangeStringValue}
        />
      ),
    },
    {
      id: USE_JSON_ID,
      name: t(UpstreamEndpointsI18nKey.ExtraDataJson),
      content: (
        <div className="h-[540px] max-h-[35vh]">
          <JsonEditorBase value={jsonValue} onChange={onChangeJsonValue} onValidateJSON={onValidateJSON} />
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col">
      <RadioGroupModalField
        title={fieldTitle ?? ''}
        popupTitle={t(UpstreamEndpointsI18nKey.ExtraDataTitle)}
        elementId="extraDataInput"
        portalId="extraDataPortal"
        customInputValue={
          typeof endpoint.extraData === 'object'
            ? JSON.stringify(endpoint.extraData, null, 2)
            : typeof endpoint.extraData === 'string'
              ? endpoint.extraData
              : t(BasicI18nKey.None)
        }
        selectedRadioValue={radioFieldId}
        valueCssClasses="w-[180px] truncate pr-2 text-left"
        isValid={isValid}
        radioButtons={radioButtons}
        onChangeRadioField={onChangeRadioField}
        onApply={onApply}
      />
    </div>
  );
};

export default ExtraDataField;
