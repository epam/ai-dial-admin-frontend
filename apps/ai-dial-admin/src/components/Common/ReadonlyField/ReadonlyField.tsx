import { FC } from 'react';
import { DialTextInputField } from '@epam/ai-dial-ui-kit';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';

interface Props {
  title: string;
  value?: string;
}
const ReadonlyField: FC<Props> = ({ value, title }) => {
  return (
    <DialTextInputField
      fieldTitle={title}
      elementId="readonlyField"
      disabled={true}
      value={value}
      iconAfter={<CopyButton field={value || ''} title={title} />}
    />
  );
};

export default ReadonlyField;
