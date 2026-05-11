'use client';

import { ChangeEvent, FC, useCallback, useRef } from 'react';
import { DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { IconFileArrowRight } from '@tabler/icons-react';

import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { EnvVariableValue } from '@/src/models/deployments/variables';
import { VALUE_TYPE } from '@/src/types/deployments/variables';

interface Props {
  onChange: (value: EnvVariableValue) => void;
  disabled?: boolean;
}

const FileButton: FC<Props> = ({ onChange, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result as string;
        const base64Content = result.split(',')[1] || '';

        onChange({
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
    [onChange],
  );

  return (
    <>
      <DialNeutralButton
        iconBefore={<IconFileArrowRight {...BASE_BUTTON_ICON_PROPS} />}
        onClick={onClick}
        disabled={disabled}
      />
      <input type="file" className="hidden" ref={fileInputRef} onChange={onFileChange} />
    </>
  );
};

export default FileButton;
