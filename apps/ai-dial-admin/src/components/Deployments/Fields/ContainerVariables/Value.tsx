import { ChangeEvent, FC, memo, useCallback, useRef } from 'react';
import { IconFileArrowRight } from '@tabler/icons-react';
import { DialPasswordInput, DialNeutralButton, DialInput } from '@epam/ai-dial-ui-kit';

import { EnvVariableValue } from '@/src/models/deployments/variables';
import { BasicI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { MOUNT_TYPE, VALUE_TYPE } from '@/src/types/deployments/variables';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

import ValueFile from '@/src/components/Deployments/Fields/ContainerVariables/ValueFile';
import classNames from 'classnames';

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
  const fieldName = index === 0 ? t(BasicI18nKey.Value) : '';

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
    <div className="flex w-full relative pr-[50px]">
      {value.$type === VALUE_TYPE.SIMPLE && (
        <div className="flex-1">
          {mountType === MOUNT_TYPE.SECURE_CONTENT || mountType === MOUNT_TYPE.SECURE_FILE ? (
            <DialPasswordInput
              id={`value_${index}`}
              value={value.value}
              placeholder={t(EntityPlaceholdersI18nKey.Value)}
              labelProps={{ label: fieldName }}
              onChange={onChangeValue}
              disabled={disabled}
            />
          ) : (
            <DialInput
              id={`value_${index}`}
              value={value.value}
              placeholder={t(EntityPlaceholdersI18nKey.Value)}
              labelProps={{ label: fieldName }}
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
        className={classNames('absolute right-0', index === 0 && 'mt-[23px]')}
        disabled={disabled}
      />
      <input type="file" className="hidden" ref={inputRef} onChange={handleFileUpload} />
    </div>
  );
};

export default memo(ContainerVariableValue);
