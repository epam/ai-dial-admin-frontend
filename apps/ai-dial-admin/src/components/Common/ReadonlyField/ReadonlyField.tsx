import { FC } from 'react';
import { DialTextInputField } from '@epam/ai-dial-ui-kit';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';

interface Props {
  title: string;
  value?: string;
  elementId?: string;
}
const ReadonlyField: FC<Props> = ({ value, title, elementId }) => {
  return (
    <DialTextInputField
      fieldTitle={title}
      elementId={elementId || 'readonlyField'}
      disabled={true}
      value={value}
      iconAfter={<CopyButton field={value || ''} title={title} cssClass="ml-2" />}
    />
  );
};

export default ReadonlyField;
