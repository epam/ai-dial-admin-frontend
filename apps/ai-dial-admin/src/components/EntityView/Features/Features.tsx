import { useCallback } from 'react';

import Switch from '@/src/components/Common/Switch/Switch';
import EndpointControl from '@/src/components/EntityMainProperties/BaseProperties/Endpoint/Endpoint';
import { FeaturesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialFeatures } from '@/src/models/dial/features';
import { ApplicationRoute } from '@/src/types/routes';
import { placeholdersMap } from './constants';
import { getSwitchControls, getTextControls } from './utils';

interface Props<T> {
  view: ApplicationRoute;
  entity: T;
  onChangeEntity: (entity: T) => void;
}

const EntityFeatures = <T extends { features?: DialFeatures }>({ view, entity, onChangeEntity }: Props<T>) => {
  const t = useI18n() as (key: string) => string;
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
    <div className="h-full flex flex-col pt-3 gap-y-9 lg:w-[35%]">
      {textKeys.map((key) => {
        return (
          <EndpointControl
            key={key}
            id={key}
            required={true}
            fieldTitle={t(FeaturesI18nKey[key as keyof typeof FeaturesI18nKey])}
            placeholder={t(placeholdersMap[key])}
            endpoint={entity.features?.[key] as string}
            onChange={(value) => onChange(value, key)}
          />
        );
      })}

      {switchKeys.map((key) => {
        return (
          <Switch
            key={key}
            isOn={entity?.features?.[key] as boolean}
            title={t(FeaturesI18nKey[key as keyof typeof FeaturesI18nKey])}
            switchId={key}
            onChange={(value) => onSwitch(value, key)}
          />
        );
      })}
    </div>
  );
};

export default EntityFeatures;
