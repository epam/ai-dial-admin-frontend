import { FC } from 'react';

import { DialKey } from '@/src/models/dial/key';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import KeyViewStatus from './KeyStatus';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  selectedKey: DialKey;
}

const KeyViewHeader: FC<Props> = ({ selectedKey }) => {
  const t = useI18n();
  return (
    <div className="flex flex-row gap-10 w-full mb-8">
      <LabelledText label={t(EntityFieldsI18nKey.id)} text={selectedKey.name} copyable={true} />
      <LabelledText
        label={t(EntityFieldsI18nKey.createdAt)}
        text={formatDateTimeToLocalString(selectedKey.createdAt)}
      />
      <LabelledText
        label={t(EntityFieldsI18nKey.keyGeneratedAt)}
        text={formatDateTimeToLocalString(selectedKey.keyGeneratedAt)}
      />
      <LabelledText
        label={t(EntityFieldsI18nKey.expiresAt)}
        text={formatDateTimeToLocalString(selectedKey.expiresAt)}
      />
      <LabelledText label={t(EntityFieldsI18nKey.status)}>
        <KeyViewStatus data={selectedKey} />
      </LabelledText>
    </div>
  );
};

export default KeyViewHeader;
