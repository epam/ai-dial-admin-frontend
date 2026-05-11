import { DialInput } from '@epam/ai-dial-ui-kit';
import { FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import ComplexInput from '@/src/components/Common/ComplexInput/ComplexInput';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { addTrailingSlash, removeSlash } from '@/src/utils/url';
import { getUrlError } from '@/src/utils/validation/url-error';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';

export interface EndpointControlProps {
  endpoint?: string | null;
  required?: boolean;
  prefix?: string;
  disabled?: boolean;
  isFullWidth?: boolean;
  isModal?: boolean;
  onChange?: (endpoint?: string) => void;
}

export interface Props extends EndpointControlProps {
  id: string;
  label: string;
  placeholder: string;
  iconAfter?: ReactNode;
  isModal?: boolean;
  caption?: string;
}

const EndpointControl: FC<Props> = ({
  prefix,
  required,
  endpoint,
  id,
  label,
  onChange,
  isFullWidth = false,
  isModal = false,
  disabled,
  ...props
}) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const isDisabled = disabled || isReadOnlyAdmin;
  const { dispatch, resetCounter } = useSaveValidationContext();
  const [endpointError, setEndpointError] = useState<FieldError | null>(null);

  const fullValue = useMemo(() => {
    const value = endpoint ? removeSlash(endpoint) : '';
    return prefix ? `${addTrailingSlash(prefix)}${value}` : value;
  }, [endpoint, prefix]);

  const validateEndpoint = useCallback(
    (value?: string | null, shouldShownError = true) => {
      const error = getUrlError(prefix ? `${prefix}${value}` : value, t, required);
      dispatch({ type: ValidationActionType.SetField, field: id, isValid: !error });
      if (shouldShownError) {
        setEndpointError(error);
      }
    },
    [dispatch, id, required, t, prefix],
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
      validateEndpoint(endpoint, !isModal);
    } else {
      dispatch({ type: ValidationActionType.SetField, field: id, isValid: true });
    }

    return () => {
      dispatch({ type: ValidationActionType.SetField, field: id, isValid: true });
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [required]);

  useEffect(() => {
    if (resetCounter || (endpoint != null && endpoint.length > 0)) {
      validateEndpoint(endpoint);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetCounter, endpoint]);

  return prefix ? (
    <ComplexInput
      prefix={prefix}
      id={id}
      value={endpoint || ''}
      required={required}
      error={endpointError?.text}
      invalid={!!endpointError}
      onChange={onChangeEndpoint}
      copyable
      fullValue={fullValue}
      label={label}
      disabled={isDisabled}
      {...props}
    />
  ) : isDisabled ? (
    <ComplexInput id={id} label={label} value={endpoint || ''} copyable disabled />
  ) : (
    <DialInput
      prefix={prefix}
      id={id}
      value={endpoint || ''}
      error={endpointError?.text}
      invalid={!!endpointError}
      onChange={onChangeEndpoint}
      labelProps={{ label, required }}
      containerClassName={isFullWidth ? 'w-full' : STANDARD_CONTROL_WIDTH}
      disabled={isDisabled}
      {...props}
    />
  );
};

export default EndpointControl;
