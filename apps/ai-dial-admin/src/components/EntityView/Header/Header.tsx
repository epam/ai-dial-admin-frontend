import { ChatEntity } from '@/src/models/dial/base-entity';
import { FC } from 'react';

import LabeledText from '@/src/components/Common/LabeledText/LabeledText';
import { useI18n } from '@/src/locales/client';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { DialApplicationScheme } from '@/src/models/dial/application';

interface Props {
  entity: ChatEntity | DialApplicationScheme;
}

const EntityHeader: FC<Props> = ({ entity }) => {
  const t = useI18n();

  const id = (entity as ChatEntity).name || (entity as DialApplicationScheme).$id;

  return (
    <div className="flex flex-col sm:flex-row gap-8 pb-8 border-b border-primary mb-3">
      <LabeledText label={t(EntityFieldsI18nKey.id)} text={id || ''} copyButton={true} />
      <LabeledText label={t(EntityFieldsI18nKey.updatedAt)} text={formatDateTimeToLocalString(entity.updatedAt)} />
      <LabeledText label={t(EntityFieldsI18nKey.createdAt)} text={formatDateTimeToLocalString(entity.createdAt)} />
    </div>
  );
};

export default EntityHeader;
