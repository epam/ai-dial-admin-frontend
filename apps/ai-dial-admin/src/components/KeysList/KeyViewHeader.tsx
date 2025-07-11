import { FC } from 'react';

import { DialKey } from '@/src/models/dial/key';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import LabeledText from '@/src/components/Common/LabeledText/LabeledText';
import KeyViewStatus from './KeyStatus/KeyViewStatus';

interface Props {
  selectedKey: DialKey;
}

const KeyViewHeader: FC<Props> = ({ selectedKey }) => {
  return (
    <div className="flex flex-row gap-10 w-full">
      <LabeledText
        label="Creation Time"
        text={selectedKey.createdAt ? formatDateTimeToLocalString(selectedKey.createdAt) : ''}
      />
      <LabeledText
        label="Key generation Time"
        text={selectedKey.keyGeneratedAt ? formatDateTimeToLocalString(selectedKey.keyGeneratedAt) : ''}
      />
      <LabeledText
        label="Expiration Time"
        text={selectedKey.expiresAt ? formatDateTimeToLocalString(selectedKey.expiresAt) : ''}
      />
      <LabeledText label="Status">
        <KeyViewStatus data={selectedKey} />
      </LabeledText>
    </div>
  );
};

export default KeyViewHeader;
