import { FC, useCallback } from 'react';

import ApplicationSource from '@/src/components/ApplicationSource/ApplicationSource';
import Defaults from '@/src/components/Defaults/Defaults';
import EntityMainProperties from '@/src/components/EntityMainProperties/EntityMainProperties';
import EntityAttachments from '@/src/components/EntityView/Properties/EntityAttachments';
import EntityIcon from '@/src/components/EntityView/Properties/EntityIcon';
import ForwardAuthTokenField from '@/src/components/EntityView/Properties/ForwardAuthToken/ForwardAuthTokenField';
import MaxRetryAttempts from '@/src/components/MaxRetryAttempts/MaxRetryAttempts';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialBaseEntity } from '@/src/models/dial/base-entity';
import { ApplicationRoute } from '@/src/types/routes';
import TopicsControl from '@/src/components/EntityMainProperties/BaseProperties/Topics';

interface Props {
  entity: DialBaseEntity;
  names: string[];
  runners: DialApplicationScheme[];
  view: ApplicationRoute;
  updateEntity: (entity: DialApplication) => void;
}

const EntityProperties: FC<Props> = ({ entity, runners, names, view, updateEntity }) => {
  const t = useI18n();

  const onChangeMaxRetryAttempts = useCallback(
    (maxRetryAttempts?: number) => {
      updateEntity({ ...(entity as DialApplication), maxRetryAttempts });
    },
    [updateEntity, entity],
  );

  return (
    <div className="h-full flex flex-col pt-3 ">
      <div className="flex flex-col gap-6">
        <EntityMainProperties
          view={view}
          entity={entity}
          onChangeEntity={updateEntity}
          names={names}
          runners={runners}
          isEntityImmutable={true}
        />
        <EntityIcon
          fieldTitle={t(EntityFieldsI18nKey.iconUrl)}
          elementId="icon"
          iconUrl={entity.iconUrl}
          onChange={(icon) => updateEntity({ ...entity, iconUrl: icon })}
        />
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
          <MaxRetryAttempts
            maxRetryAttempts={(entity as DialApplication).maxRetryAttempts}
            onChangeMaxRetryAttempts={onChangeMaxRetryAttempts}
          />
        )}
      </div>
    </div>
  );
};

export default EntityProperties;
