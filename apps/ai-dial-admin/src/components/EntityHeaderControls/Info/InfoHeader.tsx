import { FC, ReactNode } from 'react';

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import CoreSyncEntityStatus from '@/src/components/Common/SyncCoreStatus/SyncCoreStatus';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';

interface Props {
  id?: string;
  entity?: { updatedAt?: string; createdAt?: string };
  view?: ApplicationRoute;
  children?: ReactNode;
}

const EntityInfoHeader: FC<Props> = ({ id, entity, view, children }) => {
  const t = useI18n();

  return (
    <div className="flex flex-col sm:flex-row gap-8 pb-8 border-b border-primary">
      {children}
      <LabelledText label={t(EntityFieldsI18nKey.updatedAt)} text={formatDateTimeToLocalString(entity?.updatedAt)} />
      <LabelledText label={t(EntityFieldsI18nKey.createdAt)} text={formatDateTimeToLocalString(entity?.createdAt)} />

      <CoreSyncEntityStatus view={view} name={id} />
    </div>
  );
};

export default EntityInfoHeader;
