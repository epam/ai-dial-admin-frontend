import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { EnvVariableValue } from '@/src/models/deployments/variables';
import { FieldError } from '@/src/models/error';
import { VALUE_TYPE } from '@/src/types/deployments/variables';
import { getFileNameError } from '@/src/utils/deployments/validation';
import { downloadFile } from '@/src/utils/download';
import { getNameExtensionFromFile } from '@/src/utils/files/get-extension';
import { DialErrorText, DialFileIcon, DialIconButton, DialLabel, DialTooltip } from '@epam/ai-dial-ui-kit';
import { IconX } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC, useCallback, useEffect, useState } from 'react';

interface Props {
  value: EnvVariableValue;
  onValueChange: (value: EnvVariableValue) => void;
  index: number;
  fieldName?: string;
  disabled?: boolean;
}

const ValueFile: FC<Props> = ({ value, index, fieldName, onValueChange, disabled }) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();

  const [error, setError] = useState<FieldError | null>(null);

  const onClearFile = useCallback(() => {
    onValueChange({
      $type: VALUE_TYPE.SIMPLE,
      value: '',
      fileContent: '',
      fileName: '',
    });
  }, [onValueChange]);

  const handleFileDownload = useCallback(() => {
    if (!value.fileContent || !value.fileName) return;

    const blob = new Blob([atob(value.fileContent)]);
    downloadFile(blob, value.fileName);
  }, [value]);

  useEffect(() => {
    if (resetCounter || (value.fileName != null && value.fileName.length > 0)) {
      const error = getFileNameError(value.fileName as string, t);
      setError(error);
      dispatch({
        type: ValidationActionType.SetField,
        field: `variable_value_${index}`,
        isValid: !error,
      });
    }
  }, [dispatch, index, resetCounter, t, value.fileName]);

  useEffect(() => {
    return () => {
      dispatch({
        type: ValidationActionType.SetField,
        field: `variable_value_${index}`,
        isValid: true,
      });
    };
  }, [dispatch, index]);

  return (
    <div className="flex flex-col flex-1 gap-y-2 max-w-full">
      <DialLabel label={fieldName} htmlFor={`variable_value_${index}`} />
      <div
        className={classNames(
          'flex border px-3 py-1 rounded justify-between items-center',
          error ? 'border-error' : 'border-primary',
        )}
      >
        <DialTooltip tooltip={value.fileName}>
          <div className="flex flex-row gap-x-3 text-accent-primary w-full items-center" onClick={handleFileDownload}>
            <DialFileIcon extension={getNameExtensionFromFile(value.fileName as string).extension} />
            <p className="truncate flex-1 min-w-0 text-left items-center">{value.fileName}</p>
          </div>
        </DialTooltip>
        <DialIconButton
          icon={<IconX {...BASE_BUTTON_ICON_PROPS} />}
          onClick={onClearFile}
          disabled={disabled}
          className="w-auto h-auto"
        />
      </div>
      <DialErrorText errorText={error?.text} />
    </div>
  );
};

export default ValueFile;
