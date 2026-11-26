'use client';

import { FC, useMemo } from 'react';

import { ElementSize } from '@epam/ai-dial-ui-kit';

import IdentityTag from '@/src/components/Analytics/Common/IdentityTag';
import Accordion from '@/src/components/Common/Accordion/Accordion';
import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import { formatModelText } from '@/src/components/Analytics/Pipelines/Preview/utils/model-run';
import { PipelinePreviewI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  title: string;
  valueLabel: string;
  text: string;
  isTruncated?: boolean;
  truncatedHint?: string;
  note?: string;
}

const ModelRunText: FC<Props> = ({ title, valueLabel, text, isTruncated, truncatedHint, note }) => {
  const t = useI18n();

  const formatted = useMemo(() => formatModelText(text), [text]);

  return (
    <Accordion
      title={title}
      collapsed={false}
      actionButtons={
        <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
          {isTruncated && <IdentityTag label={t(PipelinePreviewI18nKey.Truncated)} />}
          <CopyButton
            buttonLabel={t(PipelinePreviewI18nKey.CopyText)}
            valueLabel={valueLabel}
            value={text}
            size={ElementSize.Small}
          />
        </div>
      }
    >
      <div className="flex flex-col gap-2">
        <pre className="whitespace-pre-wrap break-words rounded border border-secondary bg-layer-3 px-3 py-2.5 font-mono dial-tiny-text text-primary">
          {formatted}
        </pre>
        {isTruncated && truncatedHint && <span className="text-secondary dial-tiny-text">{truncatedHint}</span>}
        {note && <span className="text-secondary dial-tiny-text">{note}</span>}
      </div>
    </Accordion>
  );
};

export default ModelRunText;
