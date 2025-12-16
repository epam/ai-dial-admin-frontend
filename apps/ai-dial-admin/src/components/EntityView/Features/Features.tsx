import { useCallback } from 'react';

import { DialSwitch, DialTooltip } from '@epam/ai-dial-ui-kit';

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import EndpointControl from '@/src/components/EntityMainProperties/BaseProperties/Endpoint/Endpoint';
import { FeaturesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialFeatures } from '@/src/models/dial/features';
import { ApplicationRoute } from '@/src/types/routes';
import { runnerApplicationMap } from './constant';
import { placeholdersMap } from './constants';
import { getSwitchControls, getTextControls } from './utils';

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
  const switchKeys = getSwitchControls(view);
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

  return (
    <div className="h-full flex flex-col gap-y-8">
      {textKeys.map((key) => {
        const appRunnerKey = runnerApplicationMap[key];
        const appRunnerValue = appRunner?.[appRunnerKey as keyof DialApplicationScheme];
        if (appRunnerKey && appRunnerValue !== null) {
          return (
            <LabelledText
              label={t(FeaturesI18nKey[key as keyof typeof FeaturesI18nKey])}
              text={appRunnerValue as string}
              tooltip={t(FeaturesI18nKey.AppRunnerInherited)}
            />
          );
        }
        return (
          <EndpointControl
            key={key}
            id={key}
            fieldTitle={t(FeaturesI18nKey[key as keyof typeof FeaturesI18nKey])}
            placeholder={t(placeholdersMap[key])}
            endpoint={entity.features?.[key] as string}
            onChange={(value) => onChange(value, key)}
          />
        );
      })}

      {switchKeys.map((key) => {
        const appRunnerKey = runnerApplicationMap[key];
        const appRunnerValue = appRunner?.[appRunnerKey as keyof DialApplicationScheme];
        return (
          <DialTooltip tooltip={appRunnerKey ? t(FeaturesI18nKey.AppRunnerInherited) : ''} placement="bottom-start">
            <DialSwitch
              disabled={!!appRunnerKey}
              key={key}
              isOn={(appRunnerKey ? appRunnerValue : entity?.features?.[key]) as boolean}
              title={t(FeaturesI18nKey[key as keyof typeof FeaturesI18nKey])}
              switchId={key}
              onChange={(value) => onSwitch(value, key)}
            />
          </DialTooltip>
        );
      })}
    </div>
  );
};

export default EntityFeatures;
