import { FC } from 'react';

import Defaults from '@/src/components/Defaults/Defaults';
import IconControl from '@/src/components/BaseControls/Icon';
import MaxRetryAttempts from '@/src/components/BaseControls/MaxRetryAttempts';
import TopicsControl from '@/src/components/BaseControls/Topics';
import EntityAttachments from '@/src/components/EntityMainProperties/EntityAttachments/EntityAttachments';
import ForwardAuthTokenField from '@/src/components/EntityMainProperties/ForwardAuthToken/ForwardAuthTokenField';
import Properties from '@/src/components/EntityMainProperties/Properties/Properties';
import ApplicationSource from '@/src/components/SourceField/Application/ApplicationSource';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { ChatEntity } from '@/src/models/dial/base-entity';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  entity: ChatEntity;
  names: string[];
  runners: DialApplicationScheme[];
  view: ApplicationRoute;
  onChangeEntity: (entity: ChatEntity) => void;
}

const EntityProperties: FC<Props> = ({ runners, names, view, ...props }) => {
  return (
    <div className="h-full flex flex-col gap-y-8">
      <Properties {...props} view={view} names={names} runners={runners} isEntityImmutable={true} />

      <IconControl
        iconUrl={props.entity.iconUrl}
        onChange={(icon) => props.onChangeEntity({ ...props.entity, iconUrl: icon })}
      />

      <TopicsControl {...props} onChange={props.onChangeEntity} />

      {view === ApplicationRoute.Applications && (
        <ApplicationSource {...props} runners={runners} isEntityImmutable={true} />
      )}

      <EntityAttachments {...props} />

      {view === ApplicationRoute.Applications && <Defaults {...props} />}

      <ForwardAuthTokenField view={view} {...props} />

      {view === ApplicationRoute.Applications && <MaxRetryAttempts {...props} />}
    </div>
  );
};

export default EntityProperties;
