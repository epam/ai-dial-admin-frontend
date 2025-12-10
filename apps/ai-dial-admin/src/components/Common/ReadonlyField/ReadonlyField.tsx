import { FC } from 'react';
import { DialTextInputField } from '@epam/ai-dial-ui-kit';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';

interface Props {
  title: string;
  value?: string;
  elementId?: string;
  containerClassName?: string;
}
const ReadonlyField: FC<Props> = ({ title, elementId, ...props }) => {
  return (
    <DialTextInputField
      fieldTitle={title}
      elementId={elementId || 'readonlyField'}
      disabled={true}
      iconAfter={<CopyButton field={props.value || ''} label={title} className="ml-2" />}
      {...props}
    />
  );
};

export default ReadonlyField;
