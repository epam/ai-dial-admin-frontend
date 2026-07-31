import { ReactNode } from 'react';

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useLocalDateTimeString } from '@/src/hooks/use-local-date-time-string';
import { useI18n } from '@/src/locales/client';

interface ResourceHeaderEntity {
  author?: string;
  updated_at?: number;
  created_at?: number;
  updatedAt?: string;
  createdAt?: string;
}

interface Props<T> {
  id?: string;
  entity?: T;
  prefix?: ReactNode;
  postfix?: ReactNode;
}

const ResourceInfoHeader = <T extends ResourceHeaderEntity>({ entity, prefix, postfix }: Props<T>) => {
  const t = useI18n();
  const updatedAtValue = entity?.updated_at ?? entity?.updatedAt;
  const createdAtValue = entity?.created_at ?? entity?.createdAt;
  const updatedAt = useLocalDateTimeString(updatedAtValue);
  const createdAt = useLocalDateTimeString(createdAtValue);
  const author = entity?.author;

  return (
    <div className="flex flex-col sm:flex-row gap-8 pb-8 border-b border-primary">
      {prefix}
      {!!author && <LabelledText label={t(EntityFieldsI18nKey.author)} text={author} />}
      {!!updatedAtValue && <LabelledText label={t(EntityFieldsI18nKey.updatedAt)} text={updatedAt} />}
      {!!createdAtValue && <LabelledText label={t(EntityFieldsI18nKey.createdAt)} text={createdAt} />}
      {postfix}
    </div>
  );
};

export default ResourceInfoHeader;
