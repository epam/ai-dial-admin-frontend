import { DialLabelledText } from '@epam/ai-dial-ui-kit';
import { FC, ReactNode } from 'react';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';

interface Props {
  label: string;
  text?: string;
  copyButton?: boolean;
  children?: ReactNode;
}

const LabelledText: FC<Props> = ({ label, text, children, copyButton }) => {
  return (
    <DialLabelledText
      label={label}
      text={text}
      postfix={
        copyButton ? (
          <div className="ml-2 flex items-center justify-center">
            <CopyButton field={text || ''} title={label} />
          </div>
        ) : null
      }
    >
      {children}
    </DialLabelledText>
  );
};

export default LabelledText;
