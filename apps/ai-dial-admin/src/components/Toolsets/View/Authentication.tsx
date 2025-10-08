import { FC, useMemo } from 'react';
import {
  DialRadioGroup,
  RadioGroupOrientation,
  RadioButtonWithContent,
  DialTextInputField,
} from '@epam/ai-dial-ui-kit';

import { BasicI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Toolset, ToolsetAuthSettings, ToolsetAuthType } from '@/src/models/dial/toolset';
import OAuthControls from './OAuth';

interface Props {
  toolset: Toolset;
  onChange: (entity: Toolset) => void;
}

const Authentication: FC<Props> = ({ toolset, onChange }) => {
  const t = useI18n();
  const selectedAuthType = useMemo(() => toolset.authSettings?.authenticationType || ToolsetAuthType.NONE, [toolset]);

  const authOptions: RadioButtonWithContent[] = [
    { id: ToolsetAuthType.NONE, name: t(BasicI18nKey.None) },
    {
      id: ToolsetAuthType.API_KEY,
      name: 'API Key',
      content: (
        <div className="pl-[30px]">
          <DialTextInputField
            elementId="apiHeader"
            fieldTitle={t(EntityFieldsI18nKey.apiKeyHeader)}
            placeholder={t(EntityPlaceholdersI18nKey.ApiKeyHeader)}
            value={toolset.authSettings?.apiKeyHeader}
            onChange={(apiKeyHeader) =>
              onChange({
                ...toolset,
                authSettings: { ...(toolset.authSettings || {}), apiKeyHeader } as ToolsetAuthSettings,
              })
            }
          />
        </div>
      ),
    },
    {
      id: ToolsetAuthType.OAUTH,
      name: 'OAuth 2.0',
      content: <OAuthControls toolset={toolset} onChange={onChange} />,
    },
  ];

  return (
    <div className="flex flex-col">
      <DialRadioGroup
        fieldTitle={t(EntityFieldsI18nKey.authSettings)}
        radioButtons={authOptions}
        activeRadioButton={selectedAuthType}
        labelCssClass="small"
        elementId={'auth'}
        orientation={RadioGroupOrientation.Column}
        onChange={(authenticationType) =>
          onChange({
            ...toolset,
            authSettings: { ...toolset.authSettings, authenticationType: authenticationType as ToolsetAuthType },
          })
        }
      />
    </div>
  );
};

export default Authentication;
