import { DialInput } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ToolsetAuthSettings } from '@/src/models/dial/toolset';

interface Props {
  authSettings?: ToolsetAuthSettings;
  disabled?: boolean;
  onChange?: (authSettings: ToolsetAuthSettings) => void;
}

const ApiKeySection: FC<Props> = ({ disabled, authSettings, onChange }) => {
  const t = useI18n();

  return (
    <div className="flex flex-col gap-y-4">
      <DialInput
        id="apiKeyHeader"
        labelProps={{ label: t(EntityFieldsI18nKey.apiKeyHeader) }}
        placeholder={t(EntityPlaceholdersI18nKey.Header)}
        value={authSettings?.apiKeyHeader}
        disabled={disabled}
        required={true}
        onChange={(apiKeyHeader) => onChange?.({ ...(authSettings || {}), apiKeyHeader } as ToolsetAuthSettings)}
      />
    </div>
  );
};

export default ApiKeySection;
