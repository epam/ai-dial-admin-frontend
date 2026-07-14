import { FC, useCallback } from 'react';

import { DialLabel, DialSwitch } from '@epam/ai-dial-ui-kit';

import EndpointControl from '@/src/components/BaseControls/Endpoint/Endpoint';
import ReasoningEffortsInput from '@/src/components/EntityTabs/Features/ReasoningEffortsInput';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialApplicationResource, DialApplicationResourceFeatures } from '@/src/models/dial/resource';
import {
  resourceFeatureLabelMap,
  resourceFeaturePlaceholderMap,
  resourceSwitchGroups,
  resourceTextFeatures,
} from './constants';

interface Props {
  entity: DialApplicationResource;
  onChangeEntity: (entity: DialApplicationResource) => void;
}

const ResourceFeatures: FC<Props> = ({ entity, onChangeEntity }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

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

  return (
    <div className="flex flex-col gap-y-8">
      {resourceTextFeatures.map((key) => (
        <EndpointControl
          key={key}
          id={key}
          label={t(resourceFeatureLabelMap[key])}
          placeholder={t(resourceFeaturePlaceholderMap[key])}
          endpoint={entity.features?.[key] as string}
          onChange={(value) => onChange(value, key)}
        />
      ))}

      <ReasoningEffortsInput values={entity.features?.reasoning_efforts} onChange={onChangeReasoningEfforts} />

      {resourceSwitchGroups.map(({ title, keys }) => (
        <div key={title} className="flex flex-col gap-y-3">
          <DialLabel label={t(title)} />
          {keys.map((key) => (
            <DialSwitch
              key={key}
              disabled={isReadOnlyAdmin}
              isOn={entity.features?.[key] as boolean}
              label={t(resourceFeatureLabelMap[key])}
              switchId={key}
              onChange={(value) => onSwitch(value, key)}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default ResourceFeatures;
