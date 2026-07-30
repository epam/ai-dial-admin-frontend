import { FC } from 'react';

import SchemeProperties from '@/src/components/ApplicationRunners/ConfigurationView/Properties';
import ResourceInfoHeader from '@/src/components/Assets/Resources/ResourceInfoHeader';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialAppRunnerResource } from '@/src/models/dial/resource';
import { AppRunnerAssetProps } from './models';

/**
 * `isImmutable` renders the entity-side runner properties without the `$id` control — the id is the
 * Core resource name here, so it is fixed once created — and swaps in the extended properties block
 * (icon, title, viewer/editor url, bucket copy, topics, source).
 */
const AppRunnerAssetProperties: FC<AppRunnerAssetProps> = ({ runner, onChange }) => {
  return (
    <div className="flex flex-col">
      <ResourceInfoHeader entity={runner} />
      <div className="mt-8">
        <SchemeProperties
          names={[]}
          runner={runner}
          isImmutable
          onChangeRunner={(scheme: DialApplicationScheme) =>
            onChange({ ...runner, ...scheme } as DialAppRunnerResource)
          }
        />
      </div>
    </div>
  );
};

export default AppRunnerAssetProperties;
