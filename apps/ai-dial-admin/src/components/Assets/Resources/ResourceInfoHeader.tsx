import { FC, ReactNode } from 'react';

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useLocalDateTimeString } from '@/src/hooks/use-local-date-time-string';
import { useI18n } from '@/src/locales/client';
import { DialResource } from '@/src/models/dial/resource';

interface Props {
  id?: string;
  entity?: DialResource;
  prefix?: ReactNode;
  postfix?: ReactNode;
}

const ResourceInfoHeader: FC<Props> = ({ entity, prefix, postfix }) => {
  const t = useI18n();
  const updatedAt = useLocalDateTimeString(entity?.updated_at);
  const createdAt = useLocalDateTimeString(entity?.created_at);
  const author = entity?.author;

  return (
    <div className="flex flex-col sm:flex-row gap-8 pb-8 border-b border-primary">
      {prefix}
      {!!author && <LabelledText label={t(EntityFieldsI18nKey.author)} text={author} />}
      {!!entity?.updated_at && <LabelledText label={t(EntityFieldsI18nKey.updatedAt)} text={updatedAt} />}
      {!!entity?.created_at && <LabelledText label={t(EntityFieldsI18nKey.createdAt)} text={createdAt} />}
      {postfix}
    </div>
  );
};

export default ResourceInfoHeader;
