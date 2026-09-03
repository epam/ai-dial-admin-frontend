import { RAW_BODY_BYTE_BUDGET } from '@/src/constants/analytics/conversations-trace';
import {
  ConversationEntryBodyRow,
  HopDialect,
  HopRawBody,
  HopReadState,
  HopResponseEnvelope,
  HopResponseFacts,
  HopToolCall,
} from '@/src/models/analytics/conversations-trace';
import { assistantTextOf, sseFrames, toolCallRequestsOf } from '@/src/utils/analytics/conversation-bodies';
import {
  clampToBudget,
  isRecord,
  NO_CLAMP,
  parseJson,
  textByteLength,
  withoutBlankEdges,
} from '@/src/utils/analytics/hop-inspector/envelope';
import {
  responsesCompletedFrameOf,
  responsesOutputTextOf,
  responsesReasoningTextOf,
  responsesToolCallsOf,
  responsesStatusOf,
} from '@/src/utils/analytics/hop-inspector/responses';

/**
 * The two sources every decoder here reads, parsed once.
 *
 * Parsing is the expensive part — the recorded body averages 52.8 KB, and a stream is parsed frame by frame —
 * and the shape decode and the facts decode want the same parsed values. Reading the row directly in each
 * would parse the assembled column two or three times per read, and a stream's frames twice, for the same
 * reason `paramsOf` takes the parsed body rather than the string.
 *
 * The frames are produced on first use, not with the source: only the fallback paths read them, so a hop
 * whose assembled column answered never pays for them.
 */
interface ResponseSource {
  assembled: unknown;
  // Trimmed, and empty for a row that recorded no body — which is the test both fallbacks make before
  // reaching for it.
  raw: string;
  framesOf: () => unknown[];
}

const sourceOf = (row: ConversationEntryBodyRow): ResponseSource => {
  const raw = row.response_body?.trim() ?? '';
  let frames: unknown[] | null = null;

  return {
    assembled: parseJson(row.assembled_response ?? null),
    raw,
    framesOf: () => (frames ??= raw ? sseFrames(raw).map(parseJson) : []),
  };
};

const finishReasonIn = (parsed: unknown): string | null => {
  if (!isRecord(parsed) || !Array.isArray(parsed.choices)) {
    return null;
  }

  const [choice] = parsed.choices;

  return isRecord(choice) && typeof choice.finish_reason === 'string' ? choice.finish_reason : null;
};

// Falls back to the recorded body for the same reason the text does: the assembled column is a later addition
// to the hop log, and an instance predating it carries the finish reason only in the raw response.
const finishReasonOf = (source: ResponseSource): string | null =>
  finishReasonIn(source.assembled) ?? finishReasonIn(parseJson(source.raw || null));

interface DecodedResponse {
  text: string | null;
  reasoningText: string | null;
  status: string | null;
  toolCalls: HopToolCall[];
}

// The Responses dialect lands in the same `assembled_response` column but records a different shape —
// `output[]` rather than `choices[].message` — so the chat-completions decoder finds nothing and the tab
// reported "recorded nothing" while a full response sat in the column. A stream is decoded from its terminal
// `response.completed` frame, which carries the whole response object, rather than by accumulating deltas.
const decodeResponsesShape = (source: unknown): DecodedResponse => ({
  text: responsesOutputTextOf(source),
  reasoningText: responsesReasoningTextOf(source),
  // This shape states `status`, never `finish_reason`.
  status: responsesStatusOf(source),
  toolCalls: responsesToolCallsOf(source),
});

const responsesShapeOf = (source: ResponseSource): DecodedResponse => {
  const fromAssembled = decodeResponsesShape(source.assembled);

  // Reasoning and a tool call both count as content: a hop that spent its budget reasoning, or that called a
  // tool and said nothing, records no message item — and testing the answer alone would fall through and
  // discard what is actually there.
  if (fromAssembled.text !== null || fromAssembled.reasoningText !== null || fromAssembled.toolCalls.length > 0) {
    return fromAssembled;
  }

  if (!source.raw) {
    return fromAssembled;
  }

  return decodeResponsesShape(responsesCompletedFrameOf(source.framesOf()) ?? parseJson(source.raw));
};

const chatShapeOf = (row: ConversationEntryBodyRow, source: ResponseSource): DecodedResponse => ({
  text: assistantTextOf(row),
  reasoningText: null,
  status: finishReasonOf(source),
  toolCalls: toolCallRequestsOf(row.response_body ?? null),
});

// The one empty-facts value, exported for the same reason `NO_CLAMP` is: every envelope that reports no
// response — an unread row, a failed read — has to state the field, and a second literal spelled at each of
// those call sites is how one of them comes to omit it.
export const NO_FACTS: HopResponseFacts = {
  model: null,
  completionId: null,
  promptTokens: null,
  completionTokens: null,
  cachedTokens: null,
};

const numberIn = (source: Record<string, unknown> | null, ...keys: string[]): number | null => {
  for (const key of keys) {
    const value = source?.[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
};

// Both dialects report the same three facts at the top level of the same object; only the usage keys differ,
// `prompt_tokens` / `completion_tokens` against `input_tokens` / `output_tokens`. Reading both spellings
// costs one array and means the facts do not vanish for whichever dialect was not the one this was written
// against.
const cachedTokensIn = (usage: Record<string, unknown> | null): number | null => {
  const details = [usage?.prompt_tokens_details, usage?.input_tokens_details].find(isRecord) ?? null;

  return numberIn(details, 'cached_tokens');
};

const factsIn = (parsed: unknown): HopResponseFacts => {
  if (!isRecord(parsed)) {
    return NO_FACTS;
  }

  const usage = isRecord(parsed.usage) ? parsed.usage : null;

  return {
    model: typeof parsed.model === 'string' && parsed.model.length ? parsed.model : null,
    completionId: typeof parsed.id === 'string' && parsed.id.length ? parsed.id : null,
    promptTokens: numberIn(usage, 'prompt_tokens', 'input_tokens'),
    completionTokens: numberIn(usage, 'completion_tokens', 'output_tokens'),
    cachedTokens: cachedTokensIn(usage),
  };
};

// The facts are read from whichever source the text came from, and a stream carries its usage in a late
// frame rather than in the first: the frame that reports one is the frame that has them. A body that never
// reported usage yields no facts rather than zeros, because a zero here would read as a call that used no
// tokens.
const factsOf = (source: ResponseSource): HopResponseFacts => {
  const fromAssembled = factsIn(source.assembled);

  if (fromAssembled.model !== null || fromAssembled.promptTokens !== null) {
    return fromAssembled;
  }

  if (!source.raw) {
    return fromAssembled;
  }

  const frames = source.framesOf();
  const withUsage = frames.filter(isRecord).findLast((frame) => isRecord(frame.usage));

  return factsIn(withUsage ?? responsesCompletedFrameOf(frames) ?? parseJson(source.raw));
};

// Assembled is what the client received, and it is read from the assembled column wherever the caller's
// schema reports it — averaging 1 511 characters against 52.8 KB for the raw body. Where that column is absent
// the same decode the response side uses recovers it from the raw body, so an instance predating it is
// not left without a response.
export const responseEnvelopeOf = (row: ConversationEntryBodyRow, dialect: HopDialect): HopResponseEnvelope => {
  const source = sourceOf(row);
  const decoded = dialect === HopDialect.Responses ? responsesShapeOf(source) : chatShapeOf(row, source);
  const { status, toolCalls } = decoded;
  const text = withoutBlankEdges(decoded.text);
  const reasoningText = withoutBlankEdges(decoded.reasoningText);
  // A byte budget clamped by bytes: handing `RAW_BODY_BYTE_BUDGET` to the *character* clamp is a different
  // unit and so silently a different limit.
  const clamped = clampToBudget(text, RAW_BODY_BYTE_BUDGET);
  const hasContent = text !== null || reasoningText !== null || toolCalls.length > 0;

  return {
    state: hasContent ? HopReadState.Available : HopReadState.NoBody,
    text: clamped.text,
    textClamp: clamped.clamp,
    reasoningText,
    finishReason: status,
    toolCalls,
    facts: factsOf(source),
    recordedBytes:
      row.response_body === null || row.response_body === undefined ? null : textByteLength(row.response_body),
  };
};

// Silent truncation in an observability tool produces a reader who believes they have read the whole body, so
// the recorded size travels with the delivered one whenever the budget bites.
export const rawBodyOf = (body: string | null | undefined): HopRawBody => {
  if (body == null) {
    return { state: HopReadState.NoBody, text: null, clamp: NO_CLAMP };
  }

  const { text, clamp } = clampToBudget(body, RAW_BODY_BYTE_BUDGET);

  return { state: HopReadState.Available, text, clamp };
};
