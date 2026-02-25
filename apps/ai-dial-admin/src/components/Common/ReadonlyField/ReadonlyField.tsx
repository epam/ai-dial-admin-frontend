import { FC } from 'react';
import { DialInput } from '@epam/ai-dial-ui-kit';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';

interface Props {
  title: string;
  value?: string;
  elementId?: string;
  containerClassName?: string;
}
const ReadonlyField: FC<Props> = ({ title, elementId, ...props }) => {
  return (
    <DialInput
      fieldTitle={title}
      id={elementId || 'readonlyField'}
      disabled={true}
      iconAfter={<CopyButton value={props.value || ''} valueLabel={title} className="ml-2" />}
      {...props}
    />
  );
};

export default ReadonlyField;
