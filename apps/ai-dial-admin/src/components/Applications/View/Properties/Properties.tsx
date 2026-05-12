import { FC, useMemo } from 'react';

import IconControl from '@/src/components/BaseControls/Icon';
import MaxRetryAttempts from '@/src/components/BaseControls/MaxRetryAttempts';
import TopicsControl from '@/src/components/BaseControls/Topics';
import Defaults from '@/src/components/Defaults/Defaults';
import EntityAttachments from '@/src/components/EntityMainProperties/EntityAttachments/EntityAttachments';
import ForwardAuthTokenField from '@/src/components/EntityMainProperties/ForwardAuthToken/ForwardAuthTokenField';
import DeploymentProperties from '@/src/components/EntityMainProperties/Properties/DeploymentProperties';
import SourceField from '@/src/components/SourceField/SourceField';
import { APPLICATION_SOURCE_ITEMS } from '@/src/components/SourceField/constants';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { getApplicationContainers } from '@/src/app/actions/deployments';
import { getAppRunner } from '@/src/components/Applications/ParametersTab/utils';
import { EntitiesI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
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
  const t = useI18n();

  const application = props.entity as DialApplication;

  const appRunner = useMemo(() => getAppRunner(application, runners), [application, runners]);

  const showResponsesDefaults =
    (application.source?.$type === SOURCE_TYPE.ENDPOINTS && !!application.responsesEndpoint) ||
    (application.source?.$type === SOURCE_TYPE.SCHEMA && !!appRunner?.['dial:applicationTypeResponsesEndpoint']) ||
    (application.source?.$type === SOURCE_TYPE.CONTAINER && !!application.source?.responsesEndpointPath);

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
      <SourceField
        id="sourceType"
        view={view}
        label={t(EntitiesI18nKey.SourceType)}
        sourceItems={APPLICATION_SOURCE_ITEMS}
        entity={application}
        onChange={props.onChangeEntity as (entity: DialApplication) => void}
        runners={runners}
        getContainers={getApplicationContainers}
        isEntityImmutable={true}
      />
      <EntityAttachments {...props} />
      <Defaults
        entity={props.entity}
        onChangeEntity={props.onChangeEntity}
        title={t(EntityFieldsI18nKey.completionDefaults)}
      />
      {showResponsesDefaults && (
        <Defaults
          entity={props.entity}
          onChangeEntity={props.onChangeEntity}
          title={t(EntityFieldsI18nKey.responsesDefaults)}
          valuesKey="responsesDefaults"
          tempKey="responsesDefaultsTemp"
          validationKey="responsesDefaultKeys"
        />
      )}
      <ForwardAuthTokenField view={view} {...props} />
      <MaxRetryAttempts {...props} />
    </div>
  );
};

export default EntityProperties;
