import { FC, ReactNode, useCallback, useEffect, useState } from 'react';

import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { getUrlError } from '@/src/utils/validation/url-error';
import { DialTextInputField } from '@epam/ai-dial-ui-kit';

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
  iconAfterInput?: ReactNode;
}

const EndpointControl: FC<Props> = ({ textBeforeInput, required, endpoint, id, onChange, ...props }) => {
  const t = useI18n() as (t: string) => string;
  const { dispatch, resetCounter } = useSaveValidationContext();
  const [endpointError, setEndpointError] = useState<FieldError | null>(null);

  const validateEndpoint = useCallback(
    (value?: string | null) => {
      const error = getUrlError(textBeforeInput ? `${textBeforeInput}${value}` : value, t, required);
      setEndpointError(error);
      dispatch({ type: ValidationActionType.SetField, field: id, isValid: !error });
    },
    [dispatch, id, required, t, textBeforeInput],
  );

  const onChangeEndpoint = useCallback(
    (value?: string) => {
      validateEndpoint(value);
      onChange?.(value);
    },
    [onChange, validateEndpoint],
  );

  useEffect(() => {
    if (required) {
      dispatch({ type: ValidationActionType.SetField, field: id, isValid: !!endpoint });
    }

    dispatch({ type: ValidationActionType.SetField, field: id, isValid: true });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [required]);

  useEffect(() => {
    if (resetCounter || endpoint != null) {
      validateEndpoint(endpoint);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetCounter, endpoint]);

  return (
    <DialTextInputField
      textBeforeInput={textBeforeInput}
      elementId={id}
      value={endpoint || ''}
      optional={!required}
      errorText={endpointError?.text}
      invalid={!!endpointError}
      onChange={onChangeEndpoint}
      {...props}
    />
  );
};

export default EndpointControl;
