import { FC } from 'react';

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  value: string;
}

const ReadonlyId: FC<Props> = ({ value }) => {
  const t = useI18n();

  return (
    <LabelledText copyLabel={t(EntityFieldsI18nKey.id)} text={value || ''} copyable={true} className="!max-w-none" />
  );
};

export default ReadonlyId;
