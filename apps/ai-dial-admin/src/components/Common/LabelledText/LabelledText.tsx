import { DialLabelledText } from '@epam/ai-dial-ui-kit';
import { FC, ReactNode } from 'react';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';

interface Props {
  className?: string;
  label?: string;
  text?: string;
  tooltip?: string;
  copyable?: boolean;
  copyLabel?: string;
  children?: ReactNode;
}

const LabelledText: FC<Props> = ({ label, text, children, tooltip, copyable, copyLabel, className }) => {
  return (
    <DialLabelledText
      className={className}
      label={label}
      text={text}
      tooltip={tooltip}
      postfix={copyable ? <CopyButton field={text || ''} label={copyLabel || label} className="ml-2" /> : null}
    >
      {children}
    </DialLabelledText>
  );
};

export default LabelledText;
