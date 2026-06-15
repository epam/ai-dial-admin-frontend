import { FC, ReactNode } from 'react';

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useLocalDateTimeString } from '@/src/hooks/use-local-date-time-string';
import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  id?: string;
  entity?: { updatedAt?: string; createdAt?: string };
  view: ApplicationRoute;
  prefix?: ReactNode;
  postfix?: ReactNode;
}

const EntityInfoHeader: FC<Props> = ({ entity, view, prefix, postfix }) => {
  const t = useI18n();
  const updatedAt = useLocalDateTimeString(entity?.updatedAt);
  const createdAt = useLocalDateTimeString(entity?.createdAt);

  return (
    <div className="flex flex-col sm:flex-row gap-8 pb-8 border-b border-primary">
      {prefix}
      {!!entity?.updatedAt && view !== ApplicationRoute.Runs && (
        <LabelledText label={t(EntityFieldsI18nKey.updatedAt)} text={updatedAt} />
      )}
      {!!entity?.createdAt && view !== ApplicationRoute.Runs && (
        <LabelledText label={t(EntityFieldsI18nKey.createdAt)} text={createdAt} />
      )}
      {postfix}
    </div>
  );
};

export default EntityInfoHeader;
