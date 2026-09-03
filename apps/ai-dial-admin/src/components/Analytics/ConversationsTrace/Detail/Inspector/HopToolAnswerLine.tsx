'use client';

import classNames from 'classnames';
import { FC } from 'react';

import { HOP_FAILED_CHIP_CLASS } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { HopToolAnswer } from '@/src/models/analytics/conversations-trace';
import { shortCallId } from '@/src/utils/analytics/conversation-formatting';

interface Props {
  answers: HopToolAnswer[];
  isError: boolean;
}

/**
 * What a result message answers, and whether the tool reported a failure.
 *
 * A result carries only the id of the call it answers, so on its own it is an anonymous block of text: a turn
 * that called one tool three times is answered by three messages nothing on screen tells apart. The tool's
 * name comes from the pairing the envelope resolved; the tail of the id is what separates two results of the
 * same tool.
 *
 * The failure flag is stated in words as well as by colour — a tool that failed is usually the reason a
 * reader opened the hop, and colour alone carries nothing to a reader who cannot perceive it.
 */
const HopToolAnswerLine: FC<Props> = ({ answers, isError }) => {
  const t = useI18n();

  if (!answers.length && !isError) {
    return null;
  }

  return (
    <span className="flex min-w-0 flex-wrap items-center gap-1.5 font-mono text-secondary dial-caption-text">
      {answers.length > 0 && (
        <>
          <span>{t(ConversationsTraceI18nKey.InspectorToolAnswers)}</span>
          {answers.map(({ callId, toolName }) => (
            <span key={callId} className="text-primary">
              {toolName ?? ''}
              <span className="pl-1 text-secondary">#{shortCallId(callId)}</span>
            </span>
          ))}
        </>
      )}
      {isError && (
        <span className={classNames('rounded border px-1.5 py-0.5', HOP_FAILED_CHIP_CLASS)}>
          {t(ConversationsTraceI18nKey.InspectorToolFailed)}
        </span>
      )}
    </span>
  );
};

export default HopToolAnswerLine;
