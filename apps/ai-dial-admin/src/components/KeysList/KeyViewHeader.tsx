import { FC } from 'react';

import { DialKey } from '@/src/models/dial/key';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import LabeledText from '@/src/components/Common/LabeledText/LabeledText';
import KeyViewStatus from './KeyStatus/KeyViewStatus';
import { CreateI18nKey, EntitiesI18nKey, KeysI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  selectedKey: DialKey;
}

const KeyViewHeader: FC<Props> = ({ selectedKey }) => {
  const t = useI18n();
  return (
    <div className="flex flex-row gap-10 w-full">
      <LabeledText label={t(CreateI18nKey.IdTitle)} text={selectedKey.name} copyButton={true} />
      <LabeledText label={t(EntitiesI18nKey.CreatedAt)} text={formatDateTimeToLocalString(selectedKey.createdAt)} />
      <LabeledText
        label={t(KeysI18nKey.KeyGenerationTime)}
        text={formatDateTimeToLocalString(selectedKey.keyGeneratedAt)}
      />
      <LabeledText label={t(KeysI18nKey.ExpirationTime)} text={formatDateTimeToLocalString(selectedKey.expiresAt)} />
      <LabeledText label={t(KeysI18nKey.StatusTitle)}>
        <KeyViewStatus data={selectedKey} />
      </LabeledText>
    </div>
  );
};

export default KeyViewHeader;
