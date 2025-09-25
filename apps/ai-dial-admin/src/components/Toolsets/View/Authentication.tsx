import { FC, useMemo } from 'react';

import RadioGroup, { RadioButtonWithContent } from '@/src/components/Common/RadioGroup/RadioGroup';
import { BasicI18nKey, EntityFieldsI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Toolset, ToolsetAuthSettings, ToolsetAuthType } from '@/src/models/dial/toolset';
import { RadioFieldOrientation } from '@/src/types/radio-orientation';
import { TextInputField } from '@/src/components/Common/InputField/InputField';

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
        <div className="pl-[32px]">
          <TextInputField
            elementId="apiHeader"
            fieldTitle={t(EntityFieldsI18nKey.apiKeyHeader)}
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
  ];

  return (
    <div className="flex flex-col">
      <RadioGroup
        fieldTitle={t(ToolsetI18nKey.Authentication)}
        radioButtons={authOptions}
        activeRadioButton={selectedAuthType}
        labelCssClass="small"
        elementId={'auth'}
        orientation={RadioFieldOrientation.Column}
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
