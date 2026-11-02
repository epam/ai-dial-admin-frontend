'use client';

import { FC, useId } from 'react';

import { ElementSize } from '@epam/ai-dial-ui-kit';
import { IconChevronRight } from '@tabler/icons-react';
import classNames from 'classnames';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import HighlightedEditor from '@/src/components/Runs/Details/ValuePopups/HighlightedEditor';
import { FormattedInfoText } from '@/src/components/Runs/Details/ValuePopups/models';
import { TextDiffRange } from '@/src/models/text-diff';
import { formatJsonSize } from '@/src/utils/evaluation/json-highlight';

interface Props {
  title: string;
  info: FormattedInfoText;
  isOpen: boolean;
  onToggle: () => void;
  highlights?: TextDiffRange[];
}

const NO_HIGHLIGHTS: TextDiffRange[] = [];

const MetricInfoCard: FC<Props> = ({ title, info, isOpen, onToggle, highlights = NO_HIGHLIGHTS }) => {
  const contentId = useId();

  return (
    <div
      className={classNames('flex flex-col min-h-0 rounded bg-layer-2 overflow-hidden', isOpen ? 'flex-1' : 'shrink-0')}
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3 select-none shrink-0">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 text-left text-primary cursor-pointer dial-body-semi-text"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={contentId}
        >
          <IconChevronRight
            size={20}
            className={classNames('shrink-0 transition-transform text-secondary', isOpen && 'rotate-90')}
            aria-hidden
          />
          {title}
        </button>
        <span className="flex items-center gap-2 shrink-0">
          <span className="dial-tiny-text text-secondary">{formatJsonSize(info.text)}</span>
          <CopyButton value={info.text} valueLabel={title} size={ElementSize.Small} />
        </span>
      </div>
      {isOpen && (
        <div id={contentId} className="flex-1 min-h-0 bg-layer-0">
          <HighlightedEditor text={info.text} language={info.language} highlights={highlights} />
        </div>
      )}
    </div>
  );
};

export default MetricInfoCard;
