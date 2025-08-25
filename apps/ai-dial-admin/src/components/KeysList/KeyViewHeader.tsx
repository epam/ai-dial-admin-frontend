import { FC } from 'react';

import { DialKey } from '@/src/models/dial/key';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import LabeledText from '@/src/components/Common/LabeledText/LabeledText';
import KeyViewStatus from './KeyStatus/KeyViewStatus';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  selectedKey: DialKey;
}

const KeyViewHeader: FC<Props> = ({ selectedKey }) => {
  const t = useI18n();
  return (
    <div className="flex flex-row gap-10 w-full mb-8">
      <LabeledText label={t(EntityFieldsI18nKey.id)} text={selectedKey.name} copyButton={true} />
      <LabeledText label={t(EntityFieldsI18nKey.createdAt)} text={formatDateTimeToLocalString(selectedKey.createdAt)} />
      <LabeledText
        label={t(EntityFieldsI18nKey.keyGeneratedAt)}
        text={formatDateTimeToLocalString(selectedKey.keyGeneratedAt)}
      />
      <LabeledText label={t(EntityFieldsI18nKey.expiresAt)} text={formatDateTimeToLocalString(selectedKey.expiresAt)} />
      <LabeledText label={t(EntityFieldsI18nKey.status)}>
        <KeyViewStatus data={selectedKey} />
      </LabeledText>
    </div>
  );
};

export default KeyViewHeader;
