import { ChatEntity, EntityValidityState } from '@/src/models/dial/base-entity';
import { FC } from 'react';

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import CoreSyncEntityStatus from '@/src/components/Common/SyncCoreStatus/SyncCoreStatus';
import ValidityStatus from '@/src/components/EntityView/Status/ValidityStatus';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { ApplicationRoute } from '@/src/types/routes';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { AuthHeader } from '@/src/components/Toolsets/View/Auth/AuthHeader';
import { Toolset } from '@/src/models/dial/toolset';

interface Props {
  entity?: ChatEntity | DialApplicationScheme | null;
  view?: ApplicationRoute;
}

const EntityHeader: FC<Props> = ({ entity, view }) => {
  const t = useI18n();

  const id = (entity as ChatEntity)?.name || (entity as DialApplicationScheme)?.$id;
  const status = (entity as DialInterceptor)?.status;
  const validityState = (entity as EntityValidityState)?.validityState;

  return (
    <div className="flex flex-col sm:flex-row gap-8 pb-8 border-b border-primary">
      <LabelledText label={t(EntityFieldsI18nKey.updatedAt)} text={formatDateTimeToLocalString(entity?.updatedAt)} />
      <LabelledText label={t(EntityFieldsI18nKey.createdAt)} text={formatDateTimeToLocalString(entity?.createdAt)} />
      {view === ApplicationRoute.Toolsets && <AuthHeader toolset={entity as Toolset} />}
      {status && <LabelledText label={t(EntityFieldsI18nKey.status)} text={status} />}
      {validityState && (
        <LabelledText label={t(EntityFieldsI18nKey.status)}>
          <ValidityStatus validityState={validityState} />
        </LabelledText>
      )}
      <CoreSyncEntityStatus view={view} name={id} />
    </div>
  );
};

export default EntityHeader;
