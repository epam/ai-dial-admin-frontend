import { FC, ReactNode } from 'react';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import Tooltip from '@/src/components/Common/Tooltip/Tooltip';

interface Props {
  label: string;
  text?: string;
  copyButton?: boolean;
  children?: ReactNode;
}

const LabeledText: FC<Props> = ({ label, text, children, copyButton }) => {
  return (
    <div className="flex flex-col max-w-[200px]">
      <label className="tiny mb-2 text-secondary">{label}</label>
      {children ? (
        children
      ) : (
        <div className="flex flex-row">
          <Tooltip tooltip={text}>{text}</Tooltip>

          {copyButton && (
            <div className="ml-2">
              <CopyButton field={text} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LabeledText;
