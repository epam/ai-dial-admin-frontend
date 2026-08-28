'use client';

import { useCallback, useRef, useState } from 'react';

import { getConversationTranscript } from '@/src/app/[lang]/conversations-trace/actions';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { ConversationTranscript, TranscriptState } from '@/src/models/analytics/conversations-trace';

const EMPTY_TRANSCRIPT: ConversationTranscript = { state: TranscriptState.LoadFailed, messages: [], loadedTurns: null };

interface Params {
  chatId: string;
  projectId: string;
  lastRequestTime: number | string | null;
  nowMs: number;
}

/**
 * The transcript's body read, issued when the reader first switches to Chat rather than on page open.
 *
 * Reading it on open made a body-read failure the whole page's failure, on a page whose landing view does not
 * depend on it. Whether this caller can read bodies *at all* is a schema fact resolved separately and still
 * known at open, so the switch's own gating is unaffected — only the body read moved.
 *
 * Fetched once. A reader switching back and forth is looking at the same conversation, and re-reading bodies
 * for it would be the expensive half of this page repeated for no new information.
 */
export const useConversationTranscript = ({ chatId, projectId, lastRequestTime, nowMs }: Params) => {
  const [transcript, setTranscript] = useState<ConversationTranscript | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const getReqRef = useRef(useProtectedRequest());
  const hasRequestedRef = useRef(false);

  const onRequestTranscript = useCallback(async () => {
    if (hasRequestedRef.current) {
      return;
    }
    hasRequestedRef.current = true;
    setIsLoading(true);

    try {
      const result = await getReqRef.current(getConversationTranscript, chatId, projectId, lastRequestTime, nowMs);

      setTranscript(result?.response ?? EMPTY_TRANSCRIPT);
      // A failed read is not a read: clearing the guard lets a reader retry by switching away and back,
      // rather than being stuck with the failure until the page is reloaded.
      hasRequestedRef.current = result?.success === true;
    } catch {
      setTranscript(EMPTY_TRANSCRIPT);
      hasRequestedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, [chatId, projectId, lastRequestTime, nowMs]);

  return { transcript, isLoading, onRequestTranscript };
};
