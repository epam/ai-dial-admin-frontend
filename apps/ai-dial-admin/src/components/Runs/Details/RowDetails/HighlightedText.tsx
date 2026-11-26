'use client';

import { FC } from 'react';

import classNames from 'classnames';

import { MetricHighlight } from '@/src/components/Runs/Details/RowDetails/models';
import { getHighlightChunkClass } from '@/src/components/Runs/Details/RowDetails/utils/metric-highlight';

interface Props {
  highlight: MetricHighlight;
  className?: string;
}

const HighlightedText: FC<Props> = ({ highlight, className }) => (
  <div className={classNames('min-w-0 text-primary dial-small-text', className)}>
    {highlight.sources.map((source, sourceIndex) => (
      <div key={source.key ?? `source-${sourceIndex}`} className={sourceIndex > 0 ? 'mt-2' : undefined}>
        {source.key != null && <div className="mb-1 dial-tiny-text text-secondary">{source.key}</div>}
        <p className="m-0 whitespace-pre-wrap break-words">
          {source.chunks.map((chunk, chunkIndex) => {
            const colorClass = getHighlightChunkClass(chunk.score);
            return (
              <span
                key={chunkIndex}
                className={colorClass}
                title={chunk.title}
                aria-label={colorClass != null ? `${chunk.text} (score ${chunk.score})` : undefined}
              >
                {chunk.text}
              </span>
            );
          })}
        </p>
      </div>
    ))}
  </div>
);

export default HighlightedText;
