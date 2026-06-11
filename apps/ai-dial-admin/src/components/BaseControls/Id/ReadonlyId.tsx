import { FC } from 'react';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  value: string;
}

const ReadonlyId: FC<Props> = ({ value }) => {
  const t = useI18n();

  return (
    <div className="flex-1 min-w-0">
      <LabelledText copyLabel={t(EntityFieldsI18nKey.id)} copyable={true}>
        <div className={'flex flex-row gap-x-3 items-center max-w-[640px]'}>
          <p className="truncate">{value || ''}</p>
          <CopyButton value={value || ''} valueLabel={t(EntityFieldsI18nKey.id)} />
        </div>
      </LabelledText>
    </div>
  );
};

export default ReadonlyId;
