import { FC, ReactNode } from 'react';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';

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
          <p className="flex-1 min-w-0 truncate mr-2" title={text}>
            {text}
          </p>
          {copyButton && <CopyButton field={text || ''} title={label} />}
        </div>
      )}
    </div>
  );
};

export default LabeledText;
