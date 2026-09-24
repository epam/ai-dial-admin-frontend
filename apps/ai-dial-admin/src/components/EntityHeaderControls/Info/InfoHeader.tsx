import { FC, ReactNode } from 'react';

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useLocalDateTimeString } from '@/src/hooks/use-local-date-time-string';
import { useI18n } from '@/src/locales/client';
import { CoreResourceEntityMetadata } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  id?: string;
  entity?: {
    updatedAt?: string;
    createdAt?: string;
    _metadata?: Pick<CoreResourceEntityMetadata, 'createdAt' | 'updatedAt'>;
  };
  view: ApplicationRoute;
  prefix?: ReactNode;
  postfix?: ReactNode;
}

const EntityInfoHeader: FC<Props> = ({ entity, view, prefix, postfix }) => {
  const t = useI18n();
  // A merged Core-resource entity carries its timestamps in `_metadata`; admin-backend entities
  // (e.g. Roles) carry them flat — resolve `_metadata` first so both callers work.
  const updatedAtValue = entity?._metadata?.updatedAt ?? entity?.updatedAt;
  const createdAtValue = entity?._metadata?.createdAt ?? entity?.createdAt;
  const updatedAt = useLocalDateTimeString(updatedAtValue);
  const createdAt = useLocalDateTimeString(createdAtValue);

  return (
    <div className="flex flex-col sm:flex-row gap-8 pb-8 border-b border-primary">
      {prefix}
      {!!updatedAtValue && view !== ApplicationRoute.Runs && (
        <LabelledText label={t(EntityFieldsI18nKey.updatedAt)} text={updatedAt} />
      )}
      {!!createdAtValue && view !== ApplicationRoute.Runs && (
        <LabelledText label={t(EntityFieldsI18nKey.createdAt)} text={createdAt} />
      )}
      {postfix}
    </div>
  );
};

export default EntityInfoHeader;
