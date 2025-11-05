import { DialPasswordInputField } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ToolsetAuthSettings } from '@/src/models/dial/toolset';

interface Props {
  apiKeyValue?: string;
  authSettings?: ToolsetAuthSettings;
  onChange: (authSettings: ToolsetAuthSettings) => void;
  onChangeKeyValue: (apiKeyValue?: string) => void;
}

const ApiKeySection: FC<Props> = ({ authSettings, onChange, onChangeKeyValue, apiKeyValue }) => {
  const t = useI18n();

  return (
    <div className="flex flex-col gap-y-4">
      <DialPasswordInputField
        elementId="apiKeyHeader"
        fieldTitle={t(EntityFieldsI18nKey.apiKeyHeader)}
        placeholder={t(EntityPlaceholdersI18nKey.Header)}
        value={authSettings?.apiKeyHeader}
        onChange={(apiKeyHeader) => onChange({ ...(authSettings || {}), apiKeyHeader } as ToolsetAuthSettings)}
      />
      <DialPasswordInputField
        elementId="apiKeyValue"
        fieldTitle={t(EntityFieldsI18nKey.apiKeyValue)}
        placeholder={t(EntityPlaceholdersI18nKey.Value)}
        value={apiKeyValue}
        onChange={onChangeKeyValue}
      />
    </div>
  );
};

export default ApiKeySection;
