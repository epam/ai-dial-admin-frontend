import { FC, useCallback } from 'react';

import { Switch } from '@epam/ai-dial-ui-kit';

import ConfigurationEndpointControl from '@/src/components/BaseControls/Endpoint/ConfigurationEndpointControl';
import EndpointControl from '@/src/components/BaseControls/Endpoint/Endpoint';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, FeaturesI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';

interface Props {
  runner: DialApplicationScheme;
  onChangeRunner: (entity: DialApplicationScheme) => void;
}

const AppRunnerFeatures: FC<Props> = ({ runner, onChangeRunner }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  const onChange = useCallback(
    (value: string | string[] | boolean | undefined, key: keyof DialApplicationScheme) => {
      onChangeRunner({ ...runner, [key]: value });
    },
    [runner, onChangeRunner],
  );

  return (
    <div className="flex flex-col gap-y-8 h-full">
      <ConfigurationEndpointControl
        endpoint={runner['dial:applicationTypeConfigurationEndpoint']}
        onChange={(value?: string) => {
          onChange(value, 'dial:applicationTypeConfigurationEndpoint');
        }}
      />

      <EndpointControl
        id="rateEndpoint"
        label={t(FeaturesI18nKey.rateEndpoint)}
        placeholder={t(EntityPlaceholdersI18nKey.RateEndpoint)}
        endpoint={runner['dial:applicationTypeRateEndpoint']}
        onChange={(value?: string) => {
          onChange(value, 'dial:applicationTypeRateEndpoint');
        }}
      />

      <EndpointControl
        id="tokenizeEndpoint"
        label={t(FeaturesI18nKey.tokenizeEndpoint)}
        placeholder={t(EntityPlaceholdersI18nKey.TokenizeEndpoint)}
        endpoint={runner['dial:applicationTypeTokenizeEndpoint']}
        onChange={(value?: string) => {
          onChange(value, 'dial:applicationTypeTokenizeEndpoint');
        }}
      />

      <EndpointControl
        id="promptEndpoint"
        label={t(FeaturesI18nKey.truncatePromptEndpoint)}
        placeholder={t(EntityPlaceholdersI18nKey.TruncatePromptEndpoint)}
        endpoint={runner['dial:applicationTypeTruncatePromptEndpoint']}
        onChange={(value?: string) => {
          onChange(value, 'dial:applicationTypeTruncatePromptEndpoint');
        }}
      />

      <Switch
        isOn={runner['dial:appendApplicationPropertiesHeader']}
        labelProps={{ label: t(EntityFieldsI18nKey['dial:appendApplicationPropertiesHeader']) }}
        id="appendApplicationPropertiesHeader"
        onChange={(value: boolean) => {
          onChange(value, 'dial:appendApplicationPropertiesHeader');
        }}
        disabled={isReadOnlyAdmin}
      />
      <Switch
        isOn={runner['dial:applicationTypePlaybackSupport']}
        labelProps={{ label: t(EntityFieldsI18nKey['dial:applicationTypePlaybackSupport']) }}
        id="applicationTypePlaybackSupport"
        onChange={(value: boolean) => {
          onChange(value, 'dial:applicationTypePlaybackSupport');
        }}
        disabled={isReadOnlyAdmin}
      />

      <Switch
        isOn={runner['dial:applicationTypeAssistantAttachmentsInRequestSupported']}
        labelProps={{ label: t(EntityFieldsI18nKey['dial:applicationTypeAssistantAttachmentsInRequestSupported']) }}
        id="applicationTypeAssistantAttachmentsInRequestSupported"
        onChange={(value: boolean) => {
          onChange(value, 'dial:applicationTypeAssistantAttachmentsInRequestSupported');
        }}
        disabled={isReadOnlyAdmin}
      />
    </div>
  );
};

export default AppRunnerFeatures;
