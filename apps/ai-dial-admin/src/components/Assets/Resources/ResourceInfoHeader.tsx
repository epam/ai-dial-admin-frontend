import { ReactNode } from 'react';

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useLocalDateTimeString } from '@/src/hooks/use-local-date-time-string';
import { useI18n } from '@/src/locales/client';
import { CoreResourceEntityMetadata } from '@/src/models/dial/resource';

interface ResourceHeaderEntity {
  _metadata?: Pick<CoreResourceEntityMetadata, 'author' | 'createdAt' | 'updatedAt'>;
}

interface Props<T> {
  id?: string;
  entity?: T;
  prefix?: ReactNode;
  postfix?: ReactNode;
}

const ResourceInfoHeader = <T extends ResourceHeaderEntity>({ entity, prefix, postfix }: Props<T>) => {
  const t = useI18n();
  // Every caller passes a merged Core-resource detail read, whose audit fields live in `_metadata`
  // (see `CoreResourceEntityMetadata`) — there is no flat spelling to fall back to.
  const updatedAtValue = entity?._metadata?.updatedAt;
  const createdAtValue = entity?._metadata?.createdAt;
  const updatedAt = useLocalDateTimeString(updatedAtValue);
  const createdAt = useLocalDateTimeString(createdAtValue);
  const author = entity?._metadata?.author;

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
