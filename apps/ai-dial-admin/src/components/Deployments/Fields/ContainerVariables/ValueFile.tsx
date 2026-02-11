import { FC, useCallback, useEffect, useState } from 'react';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import classNames from 'classnames';
import Field from '@/src/components/Common/Field/Field';
import { EnvVariableValue } from '@/src/models/deployments/variables';
import { getFileNameError } from '@/src/utils/deployments/validation';
import { FieldError } from '@/src/models/error';
import { VALUE_TYPE } from '@/src/types/deployments/variables';
import { DialErrorText, DialFileIcon, DialIconButton, DialTooltip } from '@epam/ai-dial-ui-kit';
import { getNameExtensionFromFile } from '@/src/utils/files/get-extension';
import { IconX } from '@tabler/icons-react';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';

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

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = value.fileName;
    link.click();

    setTimeout(() => {
      URL.revokeObjectURL(link.href);
    }, 100);
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
    <div className="flex flex-col flex-1 max-w-full">
      <Field fieldTitle={fieldName} />
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
          className="w-auto h-auto p-0"
        />
      </div>
      <DialErrorText errorText={error?.text} />
    </div>
  );
};

export default ValueFile;
