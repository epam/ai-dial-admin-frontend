import { FC } from 'react';
import { DialInput } from '@epam/ai-dial-ui-kit';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';

interface Props {
  label: string;
  value?: string;
  id?: string;
  containerClassName?: string;
}
const ReadonlyInput: FC<Props> = ({ label, id, ...props }) => {
  return (
    <DialInput
      labelProps={{ label }}
      id={id || 'readonlyInput'}
      disabled={true}
      iconAfter={<CopyButton value={props.value || ''} valueLabel={label} className="ml-2" />}
      {...props}
    />
  );
};

export default ReadonlyInput;
