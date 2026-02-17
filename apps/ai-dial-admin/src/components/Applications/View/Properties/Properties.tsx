import { FC } from 'react';

import IconControl from '@/src/components/BaseControls/Icon';
import MaxRetryAttempts from '@/src/components/BaseControls/MaxRetryAttempts';
import TopicsControl from '@/src/components/BaseControls/Topics';
import Defaults from '@/src/components/Defaults/Defaults';
import EntityAttachments from '@/src/components/EntityMainProperties/EntityAttachments/EntityAttachments';
import ForwardAuthTokenField from '@/src/components/EntityMainProperties/ForwardAuthToken/ForwardAuthTokenField';
import DeploymentProperties from '@/src/components/EntityMainProperties/Properties/DeploymentProperties';
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

const EntityProperties: FC<Props> = ({ runners, view, ...props }) => {
  return (
    <div className="h-full flex flex-col gap-y-8">
      <DeploymentProperties
        view={view}
        isEntityImmutable={true}
        runners={runners}
        isUniqueNameError={false}
        {...props}
      />
      <IconControl
        iconUrl={props.entity.iconUrl}
        onChange={(icon) => props.onChangeEntity({ ...props.entity, iconUrl: icon })}
      />
      <TopicsControl {...props} onChange={props.onChangeEntity} />
      <ApplicationSource {...props} runners={runners} isEntityImmutable={true} />
      <EntityAttachments {...props} />
      <Defaults {...props} />
      <ForwardAuthTokenField view={view} {...props} />
      <MaxRetryAttempts {...props} />
    </div>
  );
};

export default EntityProperties;
