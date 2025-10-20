import { FC, useCallback } from 'react';

import { DialSelectField, DialSwitch, DialTextInputField, SelectOption } from '@epam/ai-dial-ui-kit';

import CompletionEndpointControl from '@/src/components/EntityMainProperties/BaseProperties/Endpoint/CompletionEndpoint';
import ConfigurationEndpointControl from '@/src/components/EntityMainProperties/BaseProperties/Endpoint/ConfigurationEndpointControl';
import EditorUrlControl from '@/src/components/EntityMainProperties/BaseProperties/Endpoint/EditorUrl';
import EndpointControl from '@/src/components/EntityMainProperties/BaseProperties/Endpoint/Endpoint';
import ViewerUrlControl from '@/src/components/EntityMainProperties/BaseProperties/Endpoint/ViewerUrl';
import IconControl from '@/src/components/EntityMainProperties/BaseProperties/Icon';
import {
  BasicI18nKey,
  EntityFieldsI18nKey,
  EntityPlaceholdersI18nKey,
  FeaturesI18nKey,
  TypeI18nKey,
} from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme, TypeBucketCopy, TypeEntity } from '@/src/models/dial/application';
import TopicsControl from '@/src/components/EntityMainProperties/BaseProperties/Topics';

interface Props {
  runner: DialApplicationScheme;
  onChangeRunner: (entity: DialApplicationScheme) => void;
}

const AppRunnerExtendedProperties: FC<Props> = ({ runner, onChangeRunner }) => {
  const t = useI18n() as (key: string) => string;
  const types: SelectOption[] = [
    { value: BasicI18nKey.None, label: t(BasicI18nKey.None) },
    { value: TypeEntity.OBJECT, label: t(TypeI18nKey.Object) },
    { value: TypeEntity.BOOLEAN, label: t(TypeI18nKey.Boolean) },
  ];

  const typeBucketCopy: SelectOption[] = [
    { value: TypeBucketCopy.ENABLED, label: t(BasicI18nKey.Enabled) },
    { value: TypeBucketCopy.DISABLED, label: t(BasicI18nKey.Disabled) },
  ];

  const onChange = useCallback(
    (value: string | string[] | boolean | undefined, key: keyof DialApplicationScheme) => {
      onChangeRunner({ ...runner, [key]: value });
    },
    [runner, onChangeRunner],
  );

  const onChangeTypeCopyBucket = useCallback(
    (value?: string) => {
      onChange(value, 'dial:applicationTypeBucketCopy');
    },
    [onChange],
  );

  const onChangeCompletionEndPoint = useCallback(
    (endpoint?: string) => {
      onChange(endpoint, 'dial:applicationTypeCompletionEndpoint');
    },
    [onChange],
  );

  const onChangeConfigurationEndpoint = useCallback(
    (url?: string) => {
      onChange(url, 'dial:applicationTypeConfigurationEndpoint');
    },
    [onChange],
  );

  const onChangeRateEndpoint = useCallback(
    (url?: string) => {
      onChange(url, 'dial:applicationTypeRateEndpoint');
    },
    [onChange],
  );

  const onChangePromptEndpoint = useCallback(
    (url?: string) => {
      onChange(url, 'dial:applicationTypeTruncatePromptEndpoint');
    },
    [onChange],
  );

  const onChangeTokenizeEndpoint = useCallback(
    (url?: string) => {
      onChange(url, 'dial:applicationTypeTokenizeEndpoint');
    },
    [onChange],
  );

  const onChangeViewerUrl = useCallback(
    (url?: string) => {
      onChange(url, 'dial:applicationTypeViewerUrl');
    },
    [onChange],
  );

  const onChangeEditorUrl = useCallback(
    (url?: string) => {
      onChange(url, 'dial:applicationTypeEditorUrl');
    },
    [onChange],
  );

  return (
    <div className="flex flex-col gap-6 h-full">
      <IconControl
        iconUrl={runner['dial:applicationTypeIconUrl']}
        onChange={(icon: string) => {
          onChange(icon, 'dial:applicationTypeIconUrl');
        }}
      />
      <DialTextInputField
        elementId="title"
        fieldTitle={t(EntityFieldsI18nKey.title)}
        placeholder={t(EntityPlaceholdersI18nKey.Title)}
        value={runner.title}
        optional={true}
        onChange={(title?: string) => {
          onChangeRunner({ ...runner, title });
        }}
      />

      <div className="lg:w-[35%] flex flex-col gap-y-6">
        <DialSelectField
          value={runner.type || BasicI18nKey.None}
          elementId="type"
          options={types}
          fieldTitle={t(EntityFieldsI18nKey.type)}
          placeholder={t(EntityPlaceholdersI18nKey.Type)}
          onChange={(type) => {
            onChangeRunner({ ...runner, type: type === BasicI18nKey.None ? void 0 : (type as TypeEntity) });
          }}
        />

        <DialSelectField
          value={runner['dial:applicationTypeBucketCopy'] || TypeBucketCopy.DISABLED}
          elementId="typeCopy"
          options={typeBucketCopy}
          fieldTitle={t(EntityFieldsI18nKey['dial:applicationTypeBucketCopy'])}
          placeholder={t(EntityPlaceholdersI18nKey.TypeBucketCopy)}
          onChange={(type) => onChangeTypeCopyBucket(type as string)}
        />
      </div>
      <TopicsControl entity={runner} onChange={onChangeRunner} />

      <CompletionEndpointControl
        endpoint={runner['dial:applicationTypeCompletionEndpoint']}
        onChange={onChangeCompletionEndPoint}
      />
      <ConfigurationEndpointControl
        endpoint={runner['dial:applicationTypeConfigurationEndpoint']}
        onChange={onChangeConfigurationEndpoint}
      />

      <EndpointControl
        id="rateEndpoint"
        fieldTitle={t(FeaturesI18nKey.rateEndpoint)}
        placeholder={t(EntityPlaceholdersI18nKey.RateEndpoint)}
        endpoint={runner['dial:applicationTypeRateEndpoint']}
        onChange={onChangeRateEndpoint}
      />

      <EndpointControl
        id="promptEndpoint"
        fieldTitle={t(FeaturesI18nKey.truncatePromptEndpoint)}
        placeholder={t(EntityPlaceholdersI18nKey.TruncatePromptEndpoint)}
        endpoint={runner['dial:applicationTypeTruncatePromptEndpoint']}
        onChange={onChangePromptEndpoint}
      />

      <EndpointControl
        id="tokenizeEndpoint"
        fieldTitle={t(FeaturesI18nKey.tokenizeEndpoint)}
        placeholder={t(EntityPlaceholdersI18nKey.TokenizeEndpoint)}
        endpoint={runner['dial:applicationTypeTokenizeEndpoint']}
        onChange={onChangeTokenizeEndpoint}
      />

      <ViewerUrlControl endpoint={runner['dial:applicationTypeViewerUrl']} onChange={onChangeViewerUrl} />
      <EditorUrlControl endpoint={runner['dial:applicationTypeEditorUrl']} onChange={onChangeEditorUrl} />

      <DialSwitch
        isOn={runner['dial:appendApplicationPropertiesHeader']}
        title={t(EntityFieldsI18nKey['dial:appendApplicationPropertiesHeader'])}
        switchId="appendApplicationPropertiesHeader"
        onChange={(value: boolean) => {
          onChange(value, 'dial:appendApplicationPropertiesHeader');
        }}
      />
      <DialSwitch
        isOn={runner['dial:applicationTypePlaybackSupport']}
        title={t(EntityFieldsI18nKey['dial:applicationTypePlaybackSupport'])}
        switchId="applicationTypePlaybackSupport"
        onChange={(value: boolean) => {
          onChange(value, 'dial:applicationTypePlaybackSupport');
        }}
      />
    </div>
  );
};

export default AppRunnerExtendedProperties;
