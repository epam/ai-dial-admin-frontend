import { DialBaseEntity } from '@/src/models/dial/base-entity';
import { FC } from 'react';

import LabeledText from '@/src/components/Common/LabeledText/LabeledText';
import { useI18n } from '@/src/locales/client';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { CreateI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { DialApplicationScheme } from '@/src/models/dial/application';

interface Props {
  entity: DialBaseEntity | DialApplicationScheme;
}

const EntityHeader: FC<Props> = ({ entity }) => {
  const t = useI18n();

  const id = (entity as DialBaseEntity).name || (entity as DialApplicationScheme).$id;

  return (
    <div className="flex flex-col sm:flex-row gap-8 pb-8 border-b border-primary mb-3">
      <LabeledText label={t(CreateI18nKey.IdTitle)} text={id || ''} copyButton={true} />
      <LabeledText label={t(EntityFieldsI18nKey.updatedAt)} text={formatDateTimeToLocalString(entity.updatedAt)} />
      <LabeledText label={t(EntityFieldsI18nKey.createdAt)} text={formatDateTimeToLocalString(entity.createdAt)} />
    </div>
  );
};

export default EntityHeader;
