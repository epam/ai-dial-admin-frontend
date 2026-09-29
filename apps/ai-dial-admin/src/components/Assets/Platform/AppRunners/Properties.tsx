import { FC } from 'react';

import SchemeProperties from '@/src/components/ApplicationRunners/ConfigurationView/Properties';
import IdControl from '@/src/components/BaseControls/Id/Id';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import ResourceInfoHeader from '@/src/components/Assets/Resources/ResourceInfoHeader';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialAppRunnerResource } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
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
      <div className="mt-8 flex flex-col gap-y-8">
        <IdControl
          label={EntityFieldsI18nKey.name}
          inputId="name"
          entity={{ name: runner._metadata?.name || runner.name }}
          disabled
          isFullWidth={false}
          onChangeEntity={() => undefined}
        />
        <IdControl
          inputId="schema-id"
          entity={{ name: runner.$id }}
          disabled
          isFullWidth={false}
          onChangeEntity={() => undefined}
          isUrlId
        />
        <SchemeProperties
          names={[]}
          runner={runner}
          isImmutable
          view={ApplicationRoute.PlatformAppRunners}
          onChangeRunner={(scheme: DialApplicationScheme) =>
            onChange({ ...runner, ...scheme } as DialAppRunnerResource)
          }
        />
      </div>
    </div>
  );
};

export default AppRunnerAssetProperties;
