import { FC, useEffect, useMemo } from 'react';

import { TextInputField } from '@/src/components/Common/InputField/InputField';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { getUrlError } from '@/src/utils/validation/url-error';

export interface EndpointControlProps {
  endpoint?: string;
  textBeforeInput?: string;
  onChange?: (endpoint: string) => void;
}

export interface Props extends EndpointControlProps {
  id: string;
  fieldTitle: string;
  placeholder: string;
}

const EndpointControl: FC<Props> = ({ textBeforeInput, placeholder, fieldTitle, endpoint, onChange, id }) => {
  const t = useI18n() as (t: string) => string;
  const { dispatch } = useSaveValidationContext();

  const endpointError = useMemo(() => {
    return endpoint ? getUrlError(textBeforeInput ? `${textBeforeInput}${endpoint}` : endpoint, false, t) : null;
  }, [endpoint, textBeforeInput, t]);

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: id, isValid: !endpointError });
  }, [endpointError, textBeforeInput, t, dispatch, id]);

  return (
    <TextInputField
      textBeforeInput={textBeforeInput}
      elementId={id}
      fieldTitle={fieldTitle}
      placeholder={placeholder}
      value={endpoint}
      errorText={endpointError?.text}
      invalid={!!endpointError}
      onChange={onChange}
    />
  );
};

export default EndpointControl;
