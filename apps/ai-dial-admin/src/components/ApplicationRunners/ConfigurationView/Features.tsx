import { FC, useCallback } from 'react';

import { DialSwitch } from '@epam/ai-dial-ui-kit';

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

      <DialSwitch
        isOn={runner['dial:appendApplicationPropertiesHeader']}
        label={t(EntityFieldsI18nKey['dial:appendApplicationPropertiesHeader'])}
        switchId="appendApplicationPropertiesHeader"
        onChange={(value: boolean) => {
          onChange(value, 'dial:appendApplicationPropertiesHeader');
        }}
        disabled={isReadOnlyAdmin}
      />
      <DialSwitch
        isOn={runner['dial:applicationTypePlaybackSupport']}
        label={t(EntityFieldsI18nKey['dial:applicationTypePlaybackSupport'])}
        switchId="applicationTypePlaybackSupport"
        onChange={(value: boolean) => {
          onChange(value, 'dial:applicationTypePlaybackSupport');
        }}
        disabled={isReadOnlyAdmin}
      />

      <DialSwitch
        isOn={runner['dial:applicationTypeAssistantAttachmentsInRequestSupported']}
        label={t(EntityFieldsI18nKey['dial:applicationTypeAssistantAttachmentsInRequestSupported'])}
        switchId="applicationTypeAssistantAttachmentsInRequestSupported"
        onChange={(value: boolean) => {
          onChange(value, 'dial:applicationTypeAssistantAttachmentsInRequestSupported');
        }}
        disabled={isReadOnlyAdmin}
      />
    </div>
  );
};

export default AppRunnerFeatures;
