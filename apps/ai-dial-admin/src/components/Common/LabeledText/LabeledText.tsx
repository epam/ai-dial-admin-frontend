import { FC, ReactNode } from 'react';
import classNames from 'classnames';
import { DialTooltip } from '@epam/ai-dial-ui-kit';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';

interface Props {
  label: string;
  text?: string;
  copyButton?: boolean;
  children?: ReactNode;
}

const LabeledText: FC<Props> = ({ label, text, children, copyButton }) => {
  return (
    <div className={classNames('flex flex-col', children ? '' : 'max-w-[200px]')}>
      <label className="tiny mb-2 text-secondary">{label}</label>
      {children ? (
        children
      ) : (
        <div className="flex flex-row items-center">
          <DialTooltip tooltip={text}>{text}</DialTooltip>

          {copyButton && (
            <div className="ml-2 flex items-center justify-center">
              <CopyButton field={text || ''} title={label} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LabeledText;
