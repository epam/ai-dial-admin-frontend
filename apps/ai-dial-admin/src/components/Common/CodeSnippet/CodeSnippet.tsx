import { ElementSize } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import { FC } from 'react';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';

interface Props {
  title: string;
  value: string;
  className?: string;
}

/**
 * A read-only code block with a copy action. Deliberately plain markup rather than the Monaco-backed
 * {@link ../CodeViewer/CodeViewer}: a panel showing several never-edited snippets does not need an
 * editor instance each, and the horizontal scroll is load-bearing — a wrapped line reads as two
 * statements, so the block scrolls rather than wraps.
 */
const CodeSnippet: FC<Props> = ({ title, value, className }) => (
  <div className={classNames('border border-secondary rounded overflow-hidden shrink-0', className)}>
    <div className="flex items-center justify-between px-3 py-1.5 bg-layer-3 tiny">
      <span className="text-secondary font-mono">{title}</span>
      <CopyButton value={value} valueLabel={title} size={ElementSize.Small} />
    </div>
    <pre className="bg-layer-0 overflow-x-auto px-3 py-2.5 font-mono dial-tiny-text leading-relaxed text-primary">
      {value}
    </pre>
  </div>
);

export default CodeSnippet;
