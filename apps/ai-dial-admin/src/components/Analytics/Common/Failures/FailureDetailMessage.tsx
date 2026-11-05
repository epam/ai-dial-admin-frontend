import { FC } from 'react';

import { ElementSize } from '@epam/ai-dial-ui-kit';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';

interface Props {
  label: string;
  lines: string[];
  copyValue: string;
  noMessageLabel: string;
}

const FailureDetailMessage: FC<Props> = ({ label, lines, copyValue, noMessageLabel }) => (
  <div className="flex flex-col gap-1">
    <span className="dial-tiny-text text-secondary">{label}</span>
    <div className="relative rounded bg-layer-4 p-3 pr-10">
      {/* Fixed to the corner rather than following the last line, so it stays in one place however the
          message wraps. The right padding keeps the text out from under it. */}
      {lines.length > 0 && (
        <CopyButton className="absolute right-2 top-2" value={copyValue} valueLabel={label} size={ElementSize.Small} />
      )}
      <div className="flex min-w-0 flex-col gap-1">
        {lines.length ? (
          // `anywhere` rather than `break-word`: only it lowers the line's minimum width, so a URL with no
          // break opportunity wraps inside the block instead of running under its edge. `whitespace-normal`
          // because the code typography class sets `nowrap`, which switches wrapping off altogether.
          lines.map((line, index) => (
            <span
              key={`${index}-${line}`}
              className="dial-code-text whitespace-normal text-error [overflow-wrap:anywhere]"
            >
              {line}
            </span>
          ))
        ) : (
          // The column is nullable and some exceptions carry no message; saying so beats a blank.
          <span className="dial-small-text text-secondary">{noMessageLabel}</span>
        )}
      </div>
    </div>
  </div>
);

export default FailureDetailMessage;
