import { DialLabelledText } from '@epam/ai-dial-ui-kit';
import { FC, ReactNode } from 'react';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';

interface Props {
  label: string;
  text?: string;
  tooltip?: string;
  copyable?: boolean;
  children?: ReactNode;
}

const LabelledText: FC<Props> = ({ label, text, children, tooltip, copyable }) => {
  return (
    <DialLabelledText
      label={label}
      text={text}
      tooltip={tooltip}
      postfix={
        copyable ? (
          <div className="ml-2 flex items-center justify-center">
            <CopyButton field={text || ''} label={label} />
          </div>
        ) : null
      }
    >
      {children}
    </DialLabelledText>
  );
};

export default LabelledText;
