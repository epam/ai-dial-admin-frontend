'use client';

import classNames from 'classnames';
import { FC } from 'react';

import { SPAN_FAILED_CLASS, SPAN_KIND_CLASS, SPAN_KIND_LABEL_KEY } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { SpanKind } from '@/src/models/analytics/conversations-trace';

interface Props {
  kind: SpanKind;
  hasFailed: boolean;
  className?: string;
}

// Kind and outcome render as two badges rather than one. A single badge reading "error" reported the failure
// instead of the kind, so a failed tool call and a failed model call — different problems — looked the same.
const SpanKindBadge: FC<Props> = ({ kind, hasFailed, className }) => {
  const t = useI18n();

  return (
    <span className={classNames('flex items-center gap-2', className)}>
      <span className={classNames('rounded px-2 py-0.5 dial-tiny-semi-text', SPAN_KIND_CLASS[kind])}>
        {t(SPAN_KIND_LABEL_KEY[kind])}
      </span>
      {hasFailed && (
        <span className={classNames('rounded px-2 py-0.5 dial-tiny-semi-text', SPAN_FAILED_CLASS)}>
          {t(ConversationsTraceI18nKey.SpanFailedMarker)}
        </span>
      )}
    </span>
  );
};

export default SpanKindBadge;
