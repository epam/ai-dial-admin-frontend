import { useCallback } from 'react';

import { DialLabel, DialSwitch, DialTooltip } from '@epam/ai-dial-ui-kit';

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import EndpointControl from '@/src/components/BaseControls/Endpoint/Endpoint';
import { FeaturesI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialFeatures } from '@/src/models/dial/features';
import { ApplicationRoute } from '@/src/types/routes';
import { placeholdersMap } from './constants';
import { getReadOnlyValues, getSwitchGroups, getTextControls } from './utils';
import ReasoningEffortsInput from './ReasoningEffortsInput';

interface Props<T> {
  view: ApplicationRoute;
  entity: T;
  appRunner?: DialApplicationScheme;
  onChangeEntity: (entity: T) => void;
}

const EntityFeatures = <T extends { features?: DialFeatures }>({
  view,
  entity,
  appRunner,
  onChangeEntity,
}: Props<T>) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const switchGroups = getSwitchGroups(view);
  const textKeys = getTextControls(view);

  const onSwitch = useCallback(
    (value: boolean, key: keyof DialFeatures) => {
      onChangeEntity({
        ...entity,
        features: {
          ...(entity.features || {}),
          [key]: value,
        } as DialFeatures,
      });
    },
    [onChangeEntity, entity],
  );

  const onChange = useCallback(
    (value: string | undefined, key: keyof DialFeatures) => {
      onChangeEntity({
        ...entity,
        features: {
          ...(entity.features || {}),
          [key]: value,
        } as DialFeatures,
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
          reasoningEfforts: values,
        } as DialFeatures,
      });
    },
    [onChangeEntity, entity],
  );

  return (
    <div className="flex flex-col gap-y-8">
      {textKeys.map((key) => {
        const { value, isReadonly } = getReadOnlyValues(key, appRunner);
        if (isReadonly && value != null) {
          return (
            <LabelledText
              key={key}
              label={t(FeaturesI18nKey[key as keyof typeof FeaturesI18nKey])}
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
            label={t(FeaturesI18nKey[key as keyof typeof FeaturesI18nKey])}
            placeholder={t(placeholdersMap[key])}
            endpoint={entity.features?.[key] as string}
            onChange={(value) => onChange(value, key)}
          />
        );
      })}

      <ReasoningEffortsInput values={entity.features?.reasoningEfforts} onChange={onChangeReasoningEfforts} />

      {switchGroups.map(({ title, keys }) => (
        <div key={title} className="flex flex-col gap-y-3">
          <DialLabel label={t(title)} />
          {keys.map((key) => {
            const { value, isReadonly } = getReadOnlyValues(key, appRunner);
            return (
              <DialTooltip
                key={key}
                tooltip={isReadonly ? t(FeaturesI18nKey.AppRunnerInherited) : ''}
                placement="bottom-start"
              >
                <DialSwitch
                  disabled={isReadonly || isReadOnlyAdmin}
                  isOn={(isReadonly ? value : entity?.features?.[key]) as boolean}
                  label={t(FeaturesI18nKey[key as keyof typeof FeaturesI18nKey])}
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

export default EntityFeatures;
