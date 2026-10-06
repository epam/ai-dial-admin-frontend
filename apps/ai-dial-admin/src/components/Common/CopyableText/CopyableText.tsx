'use client';

import { FC } from 'react';

import { ElementSize, EllipsisTooltip } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';

interface Props {
  value: string;
  /** Names the value for the copy control and its confirmation. */
  copyLabel: string;
  /** Typography for the text itself. */
  textClassName?: string;
}

/**
 * One line of text with its copy control directly after it. Text that fits is followed by the control; text that
 * does not is clipped with an ellipsis and the control follows the ellipsis, the full value in the tooltip.
 *
 * The wrapper sizes to its content up to the space it is given — which is what keeps the control beside short
 * text rather than at the far edge of the column.
 */
const CopyableText: FC<Props> = ({ value, copyLabel, textClassName }) => (
  <span className="inline-flex min-w-0 max-w-full items-center gap-1 align-middle">
    <EllipsisTooltip
      text={value}
      className={classNames('min-w-0', textClassName)}
      contentClassName="max-w-[480px] [overflow-wrap:anywhere]"
    />
    <CopyButton className="shrink-0" value={value} valueLabel={copyLabel} size={ElementSize.Small} />
  </span>
);

export default CopyableText;
