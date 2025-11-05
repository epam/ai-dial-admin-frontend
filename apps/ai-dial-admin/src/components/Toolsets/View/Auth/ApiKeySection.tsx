import { DialPasswordInputField, DialTextInputField } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ToolsetAuthSettings } from '@/src/models/dial/toolset';

interface Props {
  apiKeyValue?: string;
  authSettings?: ToolsetAuthSettings;
  disabled?: boolean;
  onChange?: (authSettings: ToolsetAuthSettings) => void;
  onChangeKeyValue?: (apiKeyValue: string) => void;
}

const ApiKeySection: FC<Props> = ({ disabled, authSettings, onChange, onChangeKeyValue, apiKeyValue }) => {
  const t = useI18n();

  return (
    <div className="flex flex-col gap-y-4">
      <DialTextInputField
        elementId="apiKeyHeader"
        fieldTitle={t(EntityFieldsI18nKey.apiKeyHeader)}
        placeholder={t(EntityPlaceholdersI18nKey.Header)}
        value={authSettings?.apiKeyHeader}
        disabled={disabled}
        onChange={(apiKeyHeader) => onChange?.({ ...(authSettings || {}), apiKeyHeader } as ToolsetAuthSettings)}
      />
      <DialPasswordInputField
        elementId="apiKeyValue"
        fieldTitle={t(EntityFieldsI18nKey.apiKeyValue)}
        placeholder={t(EntityPlaceholdersI18nKey.Value)}
        value={apiKeyValue}
        disabled={disabled}
        onChange={(v) => onChangeKeyValue?.(v || '')}
      />
    </div>
  );
};

export default ApiKeySection;
