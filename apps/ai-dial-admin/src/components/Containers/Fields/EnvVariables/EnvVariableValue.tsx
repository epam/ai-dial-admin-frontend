import { ChangeEvent, FC, memo, useCallback, useRef } from 'react';
import { IconFileArrowRight, IconX } from '@tabler/icons-react';
import {
  DialIconButton,
  DialTextInputField,
  DialPasswordInputField,
  DialTooltip,
  DialFileIcon,
  DialNeutralButton,
} from '@epam/ai-dial-ui-kit';
import { EnvVariableValue } from '@/src/models/deployments/variables';
import { MOUNT_TYPE, VALUE_TYPE } from '@/src/types/deployments/variables';
import { useI18n } from '@/src/locales/client';
import { EntityPlaceholdersI18nKey, EnvVariablesI18nKey } from '@/src/constants/i18n';
import Field from '@/src/components/Common/Field/Field';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { getNameExtensionFromFile } from '@/src/utils/files/get-extension';

interface Props {
  value: EnvVariableValue;
  onValueChange: (value: EnvVariableValue) => void;
  index: number;
  mountType?: MOUNT_TYPE;
  disabled?: boolean;
}

const EnvVariableValueField: FC<Props> = ({ value, index, onValueChange, mountType, disabled }) => {
  const t = useI18n();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fieldName = t(EnvVariablesI18nKey.Value);

  const handleFileUpload = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result as string;
        const base64Content = result.split(',')[1] || '';

        onValueChange({
          $type: VALUE_TYPE.FILE,
          fileName: file.name,
          fileContent: base64Content,
        });
      };

      reader.onerror = (error) => {
        console.error('[Error]: Error reading file for env variable value', error);
      };

      reader.readAsDataURL(file);

      event.target.value = '';
    },
    [onValueChange],
  );

  const handleFileInputClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

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

  const onClearFile = useCallback(() => {
    onValueChange({
      $type: VALUE_TYPE.SIMPLE,
      value: '',
      fileContent: '',
      fileName: '',
    });
  }, [onValueChange]);

  const onChangeValue = useCallback(
    (newValue?: string) => {
      onValueChange({
        ...value,
        value: newValue,
      });
    },
    [onValueChange, value],
  );

  return (
    <div className="flex items-end w-full relative pr-[50px]">
      {value.$type === VALUE_TYPE.SIMPLE && (
        <div className="flex-1">
          {mountType === MOUNT_TYPE.SECURE_CONTENT ? (
            <DialPasswordInputField
              elementId={`value_${index}`}
              value={value.value}
              placeholder={t(EntityPlaceholdersI18nKey.Value)}
              fieldTitle={fieldName}
              onChange={onChangeValue}
              disabled={disabled}
            />
          ) : (
            <DialTextInputField
              elementId={`value ${index}`}
              value={value.value}
              placeholder={t(EntityPlaceholdersI18nKey.Value)}
              fieldTitle={fieldName}
              onChange={onChangeValue}
              disabled={disabled}
            />
          )}
        </div>
      )}
      {value.$type === VALUE_TYPE.FILE && (
        <div className="flex flex-col flex-1 max-w-full">
          <Field fieldTitle={fieldName} />
          <div className="flex border border-primary px-3 py-1 rounded justify-between">
            <DialTooltip tooltip={value.fileName}>
              <div
                className="flex flex-row gap-x-3 text-accent-primary w-full items-center"
                onClick={handleFileDownload}
              >
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
        </div>
      )}

      <DialNeutralButton
        iconBefore={<IconFileArrowRight {...BASE_BUTTON_ICON_PROPS} />}
        onClick={handleFileInputClick}
        className="absolute right-0"
      />
      <input type="file" className="hidden" ref={inputRef} onChange={handleFileUpload} />
    </div>
  );
};

export default memo(EnvVariableValueField);
