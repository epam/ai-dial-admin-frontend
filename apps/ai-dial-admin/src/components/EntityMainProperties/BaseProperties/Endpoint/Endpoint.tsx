import { DialTextInputField } from '@epam/ai-dial-ui-kit';
import { FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import ComplexInput from '@/src/components/Common/ComplexInput/ComplexInput';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { addTrailingSlash, removeSlash } from '@/src/utils/url';
import { getUrlError } from '@/src/utils/validation/url-error';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import ReadonlyField from '@/src/components/Common/ReadonlyField/ReadonlyField';

export interface EndpointControlProps {
  endpoint?: string | null;
  required?: boolean;
  textBeforeInput?: string;
  disabled?: boolean;
  isFullWidth?: boolean;
  onChange?: (endpoint?: string) => void;
}

export interface Props extends EndpointControlProps {
  id: string;
  fieldTitle: string;
  placeholder: string;
  elementClassName?: string;
  iconAfterInput?: ReactNode;
}

const EndpointControl: FC<Props> = ({
  textBeforeInput,
  required,
  endpoint,
  id,
  onChange,
  isFullWidth = false,
  ...props
}) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();
  const [endpointError, setEndpointError] = useState<FieldError | null>(null);

  const fullValue = useMemo(() => {
    const value = endpoint ? removeSlash(endpoint) : '';
    return textBeforeInput ? `${addTrailingSlash(textBeforeInput)}${value}` : value;
  }, [endpoint, textBeforeInput]);

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
      const trimmedValue = value?.trimStart();
      validateEndpoint(trimmedValue);
      onChange?.(trimmedValue);
    },
    [onChange, validateEndpoint],
  );

  useEffect(() => {
    if (required) {
      dispatch({ type: ValidationActionType.SetField, field: id, isValid: !!endpoint });
    } else {
      dispatch({ type: ValidationActionType.SetField, field: id, isValid: true });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [required]);

  useEffect(() => {
    if (resetCounter || (endpoint != null && endpoint.length > 0)) {
      validateEndpoint(endpoint);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetCounter, endpoint]);

  return textBeforeInput ? (
    <ComplexInput
      textBeforeInput={textBeforeInput}
      elementId={id}
      value={endpoint || ''}
      optional={!required}
      errorText={endpointError?.text}
      invalid={!!endpointError}
      onChange={onChangeEndpoint}
      copyable={true}
      fullValue={fullValue}
      {...props}
    />
  ) : props.disabled ? (
    <ReadonlyField
      containerClassName={isFullWidth ? 'w-full' : STANDARD_CONTROL_WIDTH}
      elementId={id}
      title={props.fieldTitle}
      value={endpoint || ''}
    />
  ) : (
    <DialTextInputField
      textBeforeInput={textBeforeInput}
      elementId={id}
      value={endpoint || ''}
      optional={!required}
      errorText={endpointError?.text}
      invalid={!!endpointError}
      onChange={onChangeEndpoint}
      containerClassName={isFullWidth ? 'w-full' : STANDARD_CONTROL_WIDTH}
      {...props}
    />
  );
};

export default EndpointControl;
