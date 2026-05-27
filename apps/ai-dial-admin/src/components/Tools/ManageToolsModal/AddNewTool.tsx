'use client';

import { FC, useCallback } from 'react';

import { ButtonsI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS, STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { ButtonAppearance, DialDangerButton, DialInput } from '@epam/ai-dial-ui-kit';
import { IconTrashX } from '@tabler/icons-react';

interface Props {
  toolName: string;
  error: FieldError | null;
  onDelete: () => void;
  onChange: (toolName: string) => void;
}

const AddNewTool: FC<Props> = ({ toolName, error, onDelete, onChange }) => {
  const t = useI18n();

  const onChangeName = useCallback(
    (name?: string) => {
      onChange(name || '');
    },
    [onChange],
  );

  return (
    <>
      <div className="flex flex-row justify-between items-center mb-4">
        <h2>{toolName}</h2>
        <DialDangerButton
          label={t(ButtonsI18nKey.Delete)}
          appearance={ButtonAppearance.Outlined}
          iconBefore={<IconTrashX {...BASE_BUTTON_ICON_PROPS} />}
          onClick={onDelete}
        />
      </div>
      <span className="text-primary dial-small block mb-4">{t(ToolsetI18nKey.CustomToolDescription)}</span>
      <DialInput
        containerClassName={STANDARD_CONTROL_WIDTH}
        id="customToolName"
        labelProps={{ label: t(EntityFieldsI18nKey.ToolName) }}
        placeholder={t(EntityPlaceholdersI18nKey.ToolName)}
        value={toolName}
        onChange={onChangeName}
        error={error?.text}
        invalid={!!error}
      />
    </>
  );
};

export default AddNewTool;
