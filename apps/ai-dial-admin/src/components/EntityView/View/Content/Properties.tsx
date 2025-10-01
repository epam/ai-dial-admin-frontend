import { FC } from 'react';

import ApplicationSource from '@/src/components/Applications/ApplicationSource/ApplicationSource';
import Defaults from '@/src/components/Defaults/Defaults';
import IconControl from '@/src/components/EntityMainProperties/BaseProperties/Icon';
import TopicsControl from '@/src/components/EntityMainProperties/BaseProperties/Topics';
import EntityMainProperties from '@/src/components/EntityMainProperties/EntityMainProperties';
import EntityAttachments from '@/src/components/EntityView/EntityAttchaments/EntityAttachments';
import ForwardAuthTokenField from '@/src/components/EntityMainProperties/ForwardAuthToken/ForwardAuthTokenField';
import MaxRetryAttempts from '@/src/components/EntityMainProperties/BaseProperties/MaxRetryAttempts';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { ChatEntity } from '@/src/models/dial/base-entity';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  entity: ChatEntity;
  names: string[];
  runners: DialApplicationScheme[];
  view: ApplicationRoute;
  updateEntity: (entity: ChatEntity) => void;
}

const EntityProperties: FC<Props> = ({ entity, runners, names, view, updateEntity }) => {
  return (
    <div className="h-full flex flex-col pt-3">
      <div className="flex flex-col gap-6">
        <EntityMainProperties
          view={view}
          entity={entity}
          onChangeEntity={updateEntity}
          names={names}
          runners={runners}
          isEntityImmutable={true}
        />
        <IconControl iconUrl={entity.iconUrl} onChange={(icon) => updateEntity({ ...entity, iconUrl: icon })} />
        <div className="lg:w-[35%]">
          <TopicsControl entity={entity} onChange={updateEntity} />
        </div>
        {view === ApplicationRoute.Applications && (
          <ApplicationSource entity={entity} onChangeEntity={updateEntity} runners={runners} isEntityImmutable={true} />
        )}
        <EntityAttachments entity={entity} onChangeEntity={updateEntity} />

        {view === ApplicationRoute.Applications && <Defaults entity={entity} onChangeEntity={updateEntity} />}
      </div>
      <div className="flex flex-col gap-6 pt-3 lg:w-[35%]">
        <ForwardAuthTokenField view={view} entity={entity} onChangeEntity={updateEntity} />

        {view === ApplicationRoute.Applications && (
          <MaxRetryAttempts entity={entity as DialApplication} onChangeEntity={updateEntity} />
        )}
      </div>
    </div>
  );
};

export default EntityProperties;
