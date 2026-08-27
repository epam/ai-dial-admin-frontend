import { FC, useCallback, useMemo } from 'react';

import { DialLabel, DialLoader, DialSwitch, DialTooltip } from '@epam/ai-dial-ui-kit';

import { useAssetRunnerDetails } from '@/src/components/Assets/use-asset-runner-details';
import EndpointControl from '@/src/components/BaseControls/Endpoint/Endpoint';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import ReasoningEffortsInput from '@/src/components/EntityTabs/Features/ReasoningEffortsInput';
import { AppRunnerOption, AppRunnerOrigin } from '@/src/components/SourceField/Application/models';
import { FeaturesI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialApplicationResource, DialApplicationResourceFeatures } from '@/src/models/dial/resource';
import {
  resourceFeatureLabelMap,
  resourceFeaturePlaceholderMap,
  resourceSwitchGroups,
  resourceTextFeatures,
} from './constants';
import { getResourceReadOnlyValues } from './utils';

interface Props {
  entity: DialApplicationResource;
  appRunner?: DialApplicationScheme;
  onChangeEntity: (entity: DialApplicationResource) => void;
}

const ResourceFeatures: FC<Props> = ({ entity, appRunner, onChangeEntity }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const { features, isLoading } = useAssetRunnerDetails(appRunner);

  const fullRunner = useMemo(() => {
    if ((appRunner as AppRunnerOption)?.origin === AppRunnerOrigin.Asset) {
      return {
        ...appRunner,
        ...features,
      };
    }
    return appRunner;
  }, [appRunner, features]);

  const isFeaturesLoading = useMemo(() => {
    if ((appRunner as AppRunnerOption)?.origin === AppRunnerOrigin.Asset) {
      return isLoading;
    }
    return false;
  }, [appRunner, isLoading]);

  const onSwitch = useCallback(
    (value: boolean, key: keyof DialApplicationResourceFeatures) => {
      onChangeEntity({
        ...entity,
        features: {
          ...(entity.features || {}),
          [key]: value,
        } as DialApplicationResourceFeatures,
      });
    },
    [onChangeEntity, entity],
  );

  const onChange = useCallback(
    (value: string | undefined, key: keyof DialApplicationResourceFeatures) => {
      onChangeEntity({
        ...entity,
        features: {
          ...(entity.features || {}),
          [key]: value,
        } as DialApplicationResourceFeatures,
      });
    },
    [onChangeEntity, entity],
  );

  const onChangeReasoningEfforts = useCallback(
    (values: string[]) => {
      onChangeEntity({
        ...entity,
        features: {
          ...(entity.features || {}),
          reasoning_efforts: values,
        } as DialApplicationResourceFeatures,
      });
    },
    [onChangeEntity, entity],
  );

  if (isFeaturesLoading) {
    return (
      <div className="flex flex-col size-full">
        <DialLoader size={40} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-8">
      {resourceTextFeatures.map((key) => {
        const { value, isReadonly } = getResourceReadOnlyValues(key, fullRunner);
        if (isReadonly && value != null) {
          return (
            <LabelledText
              key={key}
              label={t(resourceFeatureLabelMap[key])}
              text={value}
              tooltip={t(FeaturesI18nKey.AppRunnerInherited)}
              className="w-full large_tablet:w-[640px] desktop:w-[640px] large_desktop:w-2/5 max-w-full"
              copyable
            />
          );
        }
        return (
          <EndpointControl
            key={key}
            id={key}
            label={t(resourceFeatureLabelMap[key])}
            placeholder={t(resourceFeaturePlaceholderMap[key])}
            endpoint={entity.features?.[key] as string}
            onChange={(value) => onChange(value, key)}
          />
        );
      })}

      <ReasoningEffortsInput values={entity.features?.reasoning_efforts} onChange={onChangeReasoningEfforts} />

      {resourceSwitchGroups.map(({ title, keys }) => (
        <div key={title} className="flex flex-col gap-y-3">
          <DialLabel label={t(title)} />
          {keys.map((key) => {
            const { value, isReadonly } = getResourceReadOnlyValues(key, fullRunner);
            return (
              <DialTooltip
                key={key}
                tooltip={isReadonly ? t(FeaturesI18nKey.AppRunnerInherited) : ''}
                placement="bottom-start"
              >
                <DialSwitch
                  disabled={isReadonly || isReadOnlyAdmin}
                  isOn={(isReadonly ? value : entity.features?.[key]) as boolean}
                  label={t(resourceFeatureLabelMap[key])}
                  switchId={key}
                  onChange={(value) => onSwitch(value, key)}
                />
              </DialTooltip>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default ResourceFeatures;
