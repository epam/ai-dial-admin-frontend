import { FC } from 'react';
import { DialInput } from '@epam/ai-dial-ui-kit';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';

interface Props {
  label: string;
  value?: string;
  id?: string;
  containerClassName?: string;
}
const ReadonlyInput: FC<Props> = ({ label, id, ...props }) => {
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  return (
    <DialInput
      labelProps={{ label }}
      id={id || 'readonlyInput'}
      disabled={true}
      iconAfter={
        !isReadOnlyAdmin ? <CopyButton value={props.value || ''} valueLabel={label} className="ml-2" /> : undefined
      }
      {...props}
    />
  );
};

export default ReadonlyInput;
