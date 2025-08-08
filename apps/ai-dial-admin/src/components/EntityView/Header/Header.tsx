import { DialBaseEntity } from '@/src/models/dial/base-entity';
import { FC } from 'react';

import LabeledText from '@/src/components/Common/LabeledText/LabeledText';
import { useI18n } from '@/src/locales/client';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { EntitiesI18nKey, CreateI18nKey } from '@/src/constants/i18n';

interface Props {
  entity: DialBaseEntity;
}

const EntityHeader: FC<Props> = ({ entity }) => {
  const t = useI18n();

  return (
    <div className="flex flex-col sm:flex-row gap-8 pb-8 border-b border-primary mb-3">
      <LabeledText label={t(CreateI18nKey.IdTitle)} text={entity.name} />
      <LabeledText label={t(EntitiesI18nKey.UpdatedAt)} text={formatDateTimeToLocalString(entity.updatedAt)} />
      <LabeledText label={t(EntitiesI18nKey.CreatedAt)} text={formatDateTimeToLocalString(entity.createdAt)} />
    </div>
  );
};

export default EntityHeader;
