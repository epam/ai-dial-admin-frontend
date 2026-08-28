import { USAGE_LOG_RETENTION_MS } from '@/src/constants/analytics/conversations-trace';
import {
  ConversationEntryBodyRow,
  ConversationEntryHopRow,
  ConversationMessage,
  MessageRole,
  TranscriptState,
} from '@/src/models/analytics/conversations-trace';
import { assistantTextOf, transcriptMessagesOf, RecordedMessage } from '@/src/utils/analytics/conversation-bodies';
import { toNumber } from '@/src/utils/analytics/scalar';

const wholeConversationCount = (turn: number): number => 2 * turn - 1;

export const carriesWholeConversation = (entryHops: ConversationEntryHopRow[]): boolean =>
  entryHops.length > 0 &&
  entryHops.every((hop, index) => toNumber(hop.number_request_messages) === wholeConversationCount(index + 1));

const isSameMessageText = (assembled: string | null, incoming: string | undefined): boolean =>
  !assembled?.length || !incoming?.length || assembled === incoming;

const leadingOverlap = (assembled: ConversationMessage[], incoming: RecordedMessage[]): number => {
  const most = Math.min(assembled.length, incoming.length);

  for (let overlap = most; overlap > 0; overlap -= 1) {
    const tail = assembled.slice(assembled.length - overlap);
    const isMatch = tail.every(
      (message, index) =>
        message.role === incoming[index].role && isSameMessageText(message.content, incoming[index].content),
    );

    if (isMatch) {
      return overlap;
    }
  }

  return 0;
};

const bodiesByTrace = (bodies: ConversationEntryBodyRow[]): Map<string, ConversationEntryBodyRow> =>
  new Map(bodies.map((body) => [body.trace_id, body]));

const attributeWholeHistory = (
  entryHops: ConversationEntryHopRow[],
  body: ConversationEntryBodyRow,
): ConversationMessage[] => {
  const history = transcriptMessagesOf(body.request_body);
  if (history.length !== wholeConversationCount(entryHops.length)) {
    return [];
  }

  return [
    ...history.map((message, index) => ({
      role: message.role,
      content: message.content ?? null,
      trace_id: entryHops[Math.floor(index / 2)].trace_id,
    })),
    {
      role: MessageRole.Assistant,
      content: assistantTextOf(body),
      trace_id: entryHops[entryHops.length - 1].trace_id,
    },
  ];
};

export const assembleTranscript = (
  entryHops: ConversationEntryHopRow[],
  bodies: ConversationEntryBodyRow[],
): ConversationMessage[] => {
  const byTrace = bodiesByTrace(bodies);

  const newestBody = entryHops.length > 1 ? byTrace.get(entryHops[entryHops.length - 1].trace_id) : undefined;
  if (newestBody && bodies.length === 1) {
    const attributed = attributeWholeHistory(entryHops, newestBody);
    if (attributed.length) {
      return attributed;
    }
  }

  const assembled: ConversationMessage[] = [];

  for (const hop of entryHops) {
    const body = byTrace.get(hop.trace_id);
    if (!body) {
      continue;
    }

    const incoming = transcriptMessagesOf(body.request_body);
    const fresh = incoming.slice(leadingOverlap(assembled, incoming));

    for (const message of fresh) {
      assembled.push({ role: message.role, content: message.content ?? null, trace_id: hop.trace_id });
    }

    assembled.push({ role: MessageRole.Assistant, content: assistantTextOf(body), trace_id: hop.trace_id });
  }

  return assembled;
};

// The question a turn answered, keyed by trace. Read by the Chat view alone, to title a hop chain opened
// from an assistant message — a reader who clicked an answer should see that answer's question above its
// hops, not a hex id. Cards deliberately carry no body-derived text; the drawer is not a card.
export const questionsByTurn = (messages: ConversationMessage[]): Map<string, string> => {
  const questions = new Map<string, string>();

  for (const { role, content, trace_id } of messages) {
    const text = content?.trim();
    if (role === MessageRole.User && text) {
      questions.set(trace_id, text);
    }
  }

  return questions;
};

interface TranscriptStateParams {
  isReadable: boolean;
  hasLoadFailed: boolean;
  entryHopCount: number;
  hopCount: number;
  lastRequestTime: number | string | null;
  nowMs: number;
}

export const transcriptStateOf = ({
  isReadable,
  hasLoadFailed,
  entryHopCount,
  hopCount,
  lastRequestTime,
  nowMs,
}: TranscriptStateParams): TranscriptState => {
  if (hasLoadFailed) {
    return TranscriptState.LoadFailed;
  }

  if (!isReadable) {
    return TranscriptState.ColumnsUnavailable;
  }

  if (entryHopCount > 0) {
    return TranscriptState.Available;
  }

  if (hopCount > 0) {
    return TranscriptState.NotReconstructable;
  }

  const lastMs = toNumber(lastRequestTime);

  return lastMs !== null && nowMs - lastMs > USAGE_LOG_RETENTION_MS
    ? TranscriptState.Expired
    : TranscriptState.NoMessages;
};
