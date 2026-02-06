import { ChatEntity, EntityValidityState } from '@/src/models/dial/base-entity';
import { FC } from 'react';

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import CoreSyncEntityStatus from '@/src/components/Common/SyncCoreStatus/SyncCoreStatus';
import ValidityStatus from '@/src/components/EntityView/Status/ValidityStatus';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { ApplicationRoute } from '@/src/types/routes';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';

interface Props {
  entity?: ChatEntity | null;
  view?: ApplicationRoute;
}

// TODO: remove this component after review all selecte view
const EntityHeader: FC<Props> = ({ entity, view }) => {
  const t = useI18n();

  const id = (entity as ChatEntity)?.name;
  const status = (entity as DialInterceptor)?.status;
  const validityState = (entity as EntityValidityState)?.validityState;

  return (
    <div className="flex flex-col sm:flex-row gap-8 pb-8 border-b border-primary">
      <LabelledText label={t(EntityFieldsI18nKey.id)} text={id || ''} copyable={true} />
      <LabelledText label={t(EntityFieldsI18nKey.updatedAt)} text={formatDateTimeToLocalString(entity?.updatedAt)} />
      <LabelledText label={t(EntityFieldsI18nKey.createdAt)} text={formatDateTimeToLocalString(entity?.createdAt)} />
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
