import classNames from 'classnames';
import { FC } from 'react';

import { DIFF_DELETE_HIGHLIGHT_CLASS, DIFF_INSERT_HIGHLIGHT_CLASS } from '@/src/components/Common/DiffLegend/constants';
import { InlineTextDiffKind, InlineTextDiffSegment } from '@/src/utils/diff/models';

interface Props {
  segments: InlineTextDiffSegment[];
}

const InlineTextDiff: FC<Props> = ({ segments }) => {
  if (!segments.length) {
    return null;
  }

  return (
    <span className="whitespace-pre-wrap break-words [box-decoration-break:clone]">
      {segments.map((segment, index) => {
        if (segment.kind === InlineTextDiffKind.Equal) {
          return <span key={index}>{segment.text}</span>;
        }

        const highlightClass =
          segment.kind === InlineTextDiffKind.Insert ? DIFF_INSERT_HIGHLIGHT_CLASS : DIFF_DELETE_HIGHLIGHT_CLASS;

        return (
          <span key={index} className={classNames('box-decoration-clone', highlightClass)}>
            {segment.text}
          </span>
        );
      })}
    </span>
  );
};

export default InlineTextDiff;
