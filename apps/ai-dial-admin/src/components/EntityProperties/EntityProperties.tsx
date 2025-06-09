import { FC, useCallback } from 'react';

import { getModelsTopics } from '@/src/app/[lang]/models/actions';
import Multiselect from '@/src/components/Common/Multiselect/Multiselect';
import EntityMainProperties from '@/src/components/EntityMainProperties/EntityMainProperties';
import EntityAttachments from '@/src/components/EntityView/Properties/EntityAttachments';
import EntityIcon from '@/src/components/EntityView/Properties/EntityIcon';
import ForwardAuthTokenField from '@/src/components/EntityView/Properties/ForwardAuthToken/ForwardAuthTokenField';
import MaxRetryAttempts from '@/src/components/MaxRetryAttempts/MaxRetryAttempts';
import { EntitiesI18nKey, TopicsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialBaseEntity } from '@/src/models/dial/base-entity';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  entity: DialBaseEntity;
  names: string[];
  runners: DialApplicationScheme[];
  view: ApplicationRoute;
  updateEntity: (entity: DialApplication) => void;
}

const EntityProperties: FC<Props> = ({ entity, runners, names, view, updateEntity }) => {
  const t = useI18n();

  const onChangeItems = useCallback(
    (topics: string[]) => {
      updateEntity({ ...entity, topics });
    },
    [entity, updateEntity],
  );

  const onChangeMaxRetryAttempts = useCallback(
    (maxRetryAttempts?: number) => {
      updateEntity({ ...(entity as DialApplication), maxRetryAttempts });
    },
    [updateEntity, entity],
  );

  return (
    <div className="h-full flex flex-col pt-3 divide-y divide-primary">
      <div className="flex flex-col gap-4 lg:w-[35%]">
        <EntityMainProperties
          view={view}
          entity={entity}
          onChangeEntity={updateEntity}
          names={names}
          runners={runners}
          isEntityImmutable={true}
        />
        <EntityIcon
          fieldTitle={t(EntitiesI18nKey.Icon)}
          elementId="icon"
          entity={entity}
          onChangeEntity={updateEntity}
        />
        <Multiselect
          elementId="topics"
          selectedItems={entity.topics}
          getItems={getModelsTopics}
          onChangeItems={onChangeItems}
          heading={t(TopicsI18nKey.Topics)}
          title={t(TopicsI18nKey.Topics)}
          addPlaceholder={t(TopicsI18nKey.AddTopicPlaceholder)}
          addTitle={t(TopicsI18nKey.AddTopic)}
        />
        <EntityAttachments entity={entity} onChangeEntity={updateEntity} />
      </div>
      <div className="flex flex-col gap-4 mt-4 pt-4 lg:w-[35%]">
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
