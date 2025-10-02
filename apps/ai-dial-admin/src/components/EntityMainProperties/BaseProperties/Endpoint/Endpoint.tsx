import { FC, useCallback, useEffect, useState } from 'react';

import { TextInputField } from '@/src/components/Common/InputField/InputField';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { getUrlError } from '@/src/utils/validation/url-error';

export interface EndpointControlProps {
  endpoint?: string | null;
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

const EndpointControl: FC<Props> = ({ textBeforeInput, required, endpoint, id, onChange, ...props }) => {
  const t = useI18n() as (t: string) => string;
  const { dispatch } = useSaveValidationContext();
  const [endpointError, setEndpointError] = useState<FieldError | null>(null);

  const validateEndpoint = useCallback(
    (value?: string | null) => {
      const error = getUrlError(textBeforeInput ? `${textBeforeInput}${value}` : value, t, required);
      setEndpointError(error);
      dispatch({ type: ValidationActionType.SetField, field: id, isValid: !error });
    },
    [dispatch, id, required, t, textBeforeInput],
  );

  useEffect(() => {
    if (required) {
      dispatch({ type: ValidationActionType.SetField, field: id, isValid: !!endpoint });
    }
    return () => {
      dispatch({ type: ValidationActionType.SetField, field: id, isValid: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [required]);

  const onChangeEndpoint = useCallback(
    (value?: string) => {
      validateEndpoint(value);
      onChange?.(value);
    },
    [onChange, validateEndpoint],
  );

  return (
    <TextInputField
      textBeforeInput={textBeforeInput}
      elementId={id}
      value={endpoint || ''}
      optional={!required}
      errorText={endpointError?.text}
      invalid={!!endpointError}
      onChange={onChangeEndpoint}
      tooltipTriggerClassName={'flex-1'}
      {...props}
    />
  );
};

export default EndpointControl;
