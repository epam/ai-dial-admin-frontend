'use client';

import { useCallback, useEffect, useState } from 'react';

import { DialInput, DialRemoveButton } from '@epam/ai-dial-ui-kit';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';

import { ButtonsI18nKey, InterfacesI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { getUrlError } from '@/src/utils/validation/url-error';
import { BASE_BUTTON_ICON_PROPS, STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';

interface Props {
  fieldId: string;
  typeLabel: string;
  baseUrl: string;
  deploymentName: string;
  disabled?: boolean;
  supportsDeploymentName?: boolean;
  onChangeBaseUrl: (value: string) => void;
  onChangeDeploymentName: (value: string) => void;
  onDelete: () => void;
}

const InterfaceRow = ({
  fieldId,
  typeLabel,
  baseUrl,
  deploymentName,
  disabled,
  supportsDeploymentName,
  onChangeBaseUrl,
  onChangeDeploymentName,
  onDelete,
}: Props) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();
  const [error, setError] = useState<FieldError | null>(null);
  const [isExpanded, setIsExpanded] = useState(!!deploymentName);

  const validate = useCallback(
    (url?: string, shouldShowError = true) => {
      const urlError = getUrlError(url, t, true);
      dispatch({ type: ValidationActionType.SetField, field: fieldId, isValid: !urlError });
      if (shouldShowError) {
        setError(urlError);
      }
    },
    [dispatch, fieldId, t],
  );

  useEffect(() => {
    validate(baseUrl, false);

    return () => {
      dispatch({ type: ValidationActionType.RemoveField, field: fieldId });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resetCounter) {
      validate(baseUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetCounter]);

  const onChangeBaseUrlValue = useCallback(
    (newValue?: string) => {
      const trimmedValue = newValue?.trimStart() || '';
      validate(trimmedValue);
      onChangeBaseUrl(trimmedValue);
    },
    [onChangeBaseUrl, validate],
  );

  const onChangeDeploymentNameValue = useCallback(
    (newValue?: string) => {
      onChangeDeploymentName(newValue?.trimStart() || '');
    },
    [onChangeDeploymentName],
  );

  const onToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const baseUrlInput = (
    <DialInput
      id={fieldId}
      labelProps={{ label: t(InterfacesI18nKey.BaseUrl), required: true }}
      placeholder={t(InterfacesI18nKey.BaseUrlPlaceholder, { type: typeLabel })}
      value={baseUrl}
      onChange={onChangeBaseUrlValue}
      disabled={disabled}
      error={error?.text}
      invalid={!!error}
      containerClassName={STANDARD_CONTROL_WIDTH}
    />
  );

  const deleteButton = !disabled && (
    <DialRemoveButton aria-label={t(ButtonsI18nKey.Delete)} onClick={onDelete} className="mt-7" />
  );

  if (!supportsDeploymentName) {
    return (
      <div className="flex flex-col gap-y-2">
        <p className="dial-body-text font-semibold text-primary">{typeLabel}</p>
        <div className="flex items-start gap-x-2 pl-7">
          {baseUrlInput}
          {deleteButton}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-2">
      <p className="dial-body-text font-semibold text-primary">{typeLabel}</p>
      <div className="flex items-start gap-x-2">
        <button
          type="button"
          className="mt-7 block h-[40px] cursor-pointer"
          onClick={onToggleExpand}
          aria-label={t(InterfacesI18nKey.ToggleDeploymentName)}
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <IconChevronDown className="text-primary" {...BASE_BUTTON_ICON_PROPS} />
          ) : (
            <IconChevronRight className="text-primary" {...BASE_BUTTON_ICON_PROPS} />
          )}
        </button>
        <div className="flex flex-col gap-y-2">
          <div className="flex items-start gap-x-2">
            {baseUrlInput}
            {deleteButton}
          </div>
          {isExpanded && (
            <DialInput
              id={`${fieldId}-deploymentName`}
              labelProps={{ label: t(InterfacesI18nKey.DeploymentName) }}
              placeholder={t(InterfacesI18nKey.DeploymentNamePlaceholder)}
              value={deploymentName}
              onChange={onChangeDeploymentNameValue}
              disabled={disabled}
              containerClassName={STANDARD_CONTROL_WIDTH}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default InterfaceRow;
