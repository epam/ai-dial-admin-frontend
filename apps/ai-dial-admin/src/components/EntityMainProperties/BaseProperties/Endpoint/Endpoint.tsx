import { FC, useEffect, useMemo } from 'react';

import { TextInputField } from '@/src/components/Common/InputField/InputField';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { getUrlError } from '@/src/utils/validation/url-error';

export interface EndpointControlProps {
  endpoint?: string;
  required?: boolean;
  textBeforeInput?: string;
  disabled?: boolean;
  onChange?: (endpoint?: string) => void;
}

export interface Props extends EndpointControlProps {
  id: string;
  fieldTitle: string;
  placeholder: string;
  elementCssClass?: string;
  iconAfterInput?: React.ReactNode;
}

const EndpointControl: FC<Props> = ({ textBeforeInput, required, endpoint, id, ...props }) => {
  const t = useI18n() as (t: string) => string;
  const { dispatch } = useSaveValidationContext();

  const endpointError = useMemo(() => {
    return getUrlError(textBeforeInput ? `${textBeforeInput}${endpoint}` : endpoint, t, required);
  }, [endpoint, textBeforeInput, required, t]);

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: id, isValid: !endpointError });
  }, [endpointError, textBeforeInput, t, dispatch, id]);

  return (
    <TextInputField
      textBeforeInput={textBeforeInput}
      elementId={id}
      value={endpoint}
      optional={!required}
      errorText={endpointError?.text}
      invalid={!!endpointError}
      tooltipTriggerClassName={'flex-1'}
      {...props}
    />
  );
};

export default EndpointControl;
