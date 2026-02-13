import { ChangeEvent, FC, memo, useCallback, useRef } from 'react';
import { IconFileArrowRight } from '@tabler/icons-react';
import { DialTextInputField, DialPasswordInputField, DialNeutralButton } from '@epam/ai-dial-ui-kit';

import { EnvVariableValue } from '@/src/models/deployments/variables';
import { EntityPlaceholdersI18nKey, EnvVariablesI18nKey } from '@/src/constants/i18n';
import { MOUNT_TYPE, VALUE_TYPE } from '@/src/types/deployments/variables';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

import ValueFile from '@/src/components/Deployments/Fields/ContainerVariables/ValueFile';

interface Props {
  value: EnvVariableValue;
  onValueChange: (value: EnvVariableValue) => void;
  index: number;
  mountType?: MOUNT_TYPE;
  disabled?: boolean;
}

const ContainerVariableValue: FC<Props> = ({ value, index, onValueChange, mountType, disabled }) => {
  const t = useI18n();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fieldName = index === 0 ? t(EnvVariablesI18nKey.Value) : '';

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
        <ValueFile
          value={value}
          index={index}
          fieldName={fieldName}
          onValueChange={onValueChange}
          disabled={disabled}
        />
      )}

      <DialNeutralButton
        iconBefore={<IconFileArrowRight {...BASE_BUTTON_ICON_PROPS} />}
        onClick={handleFileInputClick}
        className="absolute right-0"
        disabled={disabled}
      />
      <input type="file" className="hidden" ref={inputRef} onChange={handleFileUpload} />
    </div>
  );
};

export default memo(ContainerVariableValue);
