import { FC, useCallback } from 'react';

import Switch from '@/src/components/Common/Switch/Switch';
import { FeaturesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialBaseEntity, DialFeatures } from '@/src/models/dial/base-entity';
import { TextInputField } from '@/src/components/Common/InputField/InputField';

interface Props {
  entity: DialBaseEntity;
  onChangeEntity: (entity: DialBaseEntity) => void;
}

const EntityFeatures: FC<Props> = ({ entity, onChangeEntity }) => {
  const t = useI18n();

  const onSwitchTools = useCallback(
    (value: boolean) => {
      onChangeEntity({
        ...entity,
        features: {
          ...(entity.features || {}),
          toolsSupported: value,
        } as DialFeatures,
      });
    },
    [onChangeEntity, entity],
  );

  const onSwitchSeed = useCallback(
    (value: boolean) => {
      onChangeEntity({
        ...entity,
        features: {
          ...(entity.features || {}),
          seedSupported: value,
        } as DialFeatures,
      });
    },
    [onChangeEntity, entity],
  );

  const onSwitchSystemPrompt = useCallback(
    (value: boolean) => {
      onChangeEntity({
        ...entity,
        features: {
          ...(entity.features || {}),
          systemPromptSupported: value,
        } as DialFeatures,
      });
    },
    [onChangeEntity, entity],
  );

  const onSwitchUrlAttachments = useCallback(
    (value: boolean) => {
      onChangeEntity({
        ...entity,
        features: {
          ...(entity.features || {}),
          urlAttachmentsSupported: value,
        } as DialFeatures,
      });
    },
    [onChangeEntity, entity],
  );

  const onSwitchFolderAttachments = useCallback(
    (value: boolean) => {
      onChangeEntity({
        ...entity,
        features: {
          ...(entity.features || {}),
          folderAttachmentsSupported: value,
        } as DialFeatures,
      });
    },
    [onChangeEntity, entity],
  );

  const onChangeRateEndpoint = useCallback(
    (value: string) => {
      onChangeEntity({
        ...entity,
        features: {
          ...(entity.features || {}),
          rateEndpoint: value,
        } as DialFeatures,
      });
    },
    [onChangeEntity, entity],
  );

  const onChangeTokenizeEndpoint = useCallback(
    (value: string) => {
      onChangeEntity({
        ...entity,
        features: {
          ...(entity.features || {}),
          tokenizeEndpoint: value,
        } as DialFeatures,
      });
    },
    [onChangeEntity, entity],
  );

  const onChangeTruncatePromptEndpoint = useCallback(
    (value: string) => {
      onChangeEntity({
        ...entity,
        features: {
          ...(entity.features || {}),
          truncatePromptEndpoint: value,
        } as DialFeatures,
      });
    },
    [onChangeEntity, entity],
  );

  const onChangeConfigurationEndpoint = useCallback(
    (value: string) => {
      onChangeEntity({
        ...entity,
        features: {
          ...(entity.features || {}),
          configurationEndpoint: value,
        } as DialFeatures,
      });
    },
    [onChangeEntity, entity],
  );

  const onSwitchTemperature = useCallback(
    (value: boolean) => {
      onChangeEntity({
        ...entity,
        features: {
          ...(entity.features || {}),
          temperatureSupported: value,
        } as DialFeatures,
      });
    },
    [onChangeEntity, entity],
  );

  return (
    <div className="h-full flex flex-col pt-3 gap-y-6 lg:w-[35%]">
      <TextInputField
        fieldTitle={t(FeaturesI18nKey.RateEndpoint)}
        elementId="rateEndpoint"
        placeholder={t(FeaturesI18nKey.RateEndpointPlaceholder)}
        value={entity.features?.rateEndpoint}
        onChange={onChangeRateEndpoint}
      />

      <TextInputField
        fieldTitle={t(FeaturesI18nKey.TokenizeEndpoint)}
        elementId="tokenizeEndpoint"
        placeholder={t(FeaturesI18nKey.TokenizeEndpointPlaceholder)}
        value={entity.features?.tokenizeEndpoint}
        onChange={onChangeTokenizeEndpoint}
      />

      <TextInputField
        fieldTitle={t(FeaturesI18nKey.TruncatePromptEndpoint)}
        elementId="truncatePromptEndpoint"
        placeholder={t(FeaturesI18nKey.TruncatePromptEndpointPlaceholder)}
        value={entity.features?.truncatePromptEndpoint}
        onChange={onChangeTruncatePromptEndpoint}
      />

      <TextInputField
        fieldTitle={t(FeaturesI18nKey.ConfigurationEndpoint)}
        elementId="configurationEndpoint"
        placeholder={t(FeaturesI18nKey.ConfigurationEndpointPlaceholder)}
        value={entity.features?.configurationEndpoint}
        onChange={onChangeConfigurationEndpoint}
      />

      <Switch
        isOn={entity?.features?.temperatureSupported}
        title={t(FeaturesI18nKey.Temperature)}
        switchId="temperature"
        onChange={onSwitchTemperature}
      />

      <Switch
        isOn={entity?.features?.systemPromptSupported}
        title={t(FeaturesI18nKey.SystemPrompt)}
        switchId="systemPrompt"
        onChange={onSwitchSystemPrompt}
      />

      <Switch
        isOn={entity?.features?.toolsSupported}
        title={t(FeaturesI18nKey.Tools)}
        switchId="tools"
        onChange={onSwitchTools}
      />

      <Switch
        isOn={entity?.features?.seedSupported}
        title={t(FeaturesI18nKey.Seed)}
        switchId="seed"
        onChange={onSwitchSeed}
      />

      <Switch
        isOn={entity?.features?.urlAttachmentsSupported}
        title={t(FeaturesI18nKey.URLAttachments)}
        switchId="urlAttachment"
        onChange={onSwitchUrlAttachments}
      />

      <Switch
        isOn={entity?.features?.folderAttachmentsSupported}
        title={t(FeaturesI18nKey.FolderAttachments)}
        switchId="folderAttachment"
        onChange={onSwitchFolderAttachments}
      />
    </div>
  );
};

export default EntityFeatures;
