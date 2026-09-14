import { RAW_BODY_BYTE_BUDGET } from '@/src/constants/analytics/conversations-trace';
import {
  ConversationEntryBodyRow,
  HopDialect,
  HopRawBody,
  HopReadState,
  HopResponseEnvelope,
  HopResponseFacts,
  HopMessagesResponse,
  HopToolCall,
} from '@/src/models/analytics/conversations-trace';
import { assistantTextOf, sseFrames, toolCallRequestsOf } from '@/src/utils/analytics/conversation-bodies';
import { errorMessageIn } from '@/src/utils/analytics/hop-inspector/failure';
import {
  NO_MESSAGES_RESPONSE,
  messagesMergedResponseOf,
  messagesStreamedResponseOf,
} from '@/src/utils/analytics/hop-inspector/messages';
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
  // The recorded body parsed as one object, for the readers that want it whole rather than frame by frame.
  // Memoised with the frames and for the same reason: four call sites want it, and the doc above is only
  // true if none of them re-parses 52.8 KB on its own.
  parsedRawOf: () => unknown;
  // The assembled column holds a frame transcript on roughly one response in twelve, concentrated in the
  // `mcp` and messages-dialect traffic. Reading that column as merged JSON alone reports those hops as empty
  // while the whole answer sits in it.
  assembledFramesOf: () => unknown[];
}

const framesReaderOf = (raw: string): (() => unknown[]) => {
  let frames: unknown[] | null = null;

  return () => (frames ??= raw ? sseFrames(raw).map(parseJson) : []);
};

const sourceOf = (row: ConversationEntryBodyRow): ResponseSource => {
  const raw = row.response_body?.trim() ?? '';
  const assembledRaw = row.assembled_response?.trim() ?? '';

  let parsedRaw: unknown;
  let hasParsedRaw = false;

  return {
    assembled: parseJson(assembledRaw || null),
    raw,
    framesOf: framesReaderOf(raw),
    parsedRawOf: () => {
      if (!hasParsedRaw) {
        parsedRaw = parseJson(raw || null);
        hasParsedRaw = true;
      }

      return parsedRaw;
    },
    assembledFramesOf: framesReaderOf(assembledRaw),
  };
};

// Read under both spellings for the same reason the token counts are: a fact read under one dialect's key
// alone is silently absent for every hop of the other, which is indistinguishable from a call that reported
// none.
const finishReasonIn = (parsed: unknown): string | null => {
  if (!isRecord(parsed)) {
    return null;
  }

  if (typeof parsed.stop_reason === 'string') {
    return parsed.stop_reason;
  }

  const [choice] = Array.isArray(parsed.choices) ? parsed.choices : [];

  return isRecord(choice) && typeof choice.finish_reason === 'string' ? choice.finish_reason : null;
};

// Falls back to the recorded body for the same reason the text does: the assembled column is a later addition
// to the hop log, and an instance predating it carries the finish reason only in the raw response.
const finishReasonOf = (source: ResponseSource): string | null =>
  finishReasonIn(source.assembled) ?? finishReasonIn(source.parsedRawOf());

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

  return decodeResponsesShape(responsesCompletedFrameOf(source.framesOf()) ?? source.parsedRawOf());
};

// Neither form of this dialect restates the other: the merged message carries the answer in typed blocks, and
// the stream carries it only as the fragments that concatenate into it. Both columns can hold either form, so
// all four combinations are tried before the hop is called empty — a call with no text still counts as
// content, exactly as a Responses hop that called a tool and said nothing does.
const hasMessagesContent = ({ text, toolCalls }: HopMessagesResponse): boolean => text !== null || toolCalls.length > 0;

const messagesResponseOf = (source: ResponseSource): HopMessagesResponse => {
  const candidates = [
    () => messagesMergedResponseOf(source.assembled),
    () => messagesStreamedResponseOf(source.assembledFramesOf()),
    () => (source.raw ? messagesStreamedResponseOf(source.framesOf()) : null),
    () => (source.raw ? messagesMergedResponseOf(source.parsedRawOf()) : null),
  ];

  // The finish reason is kept across candidates rather than taken from the one that answered: a stream whose
  // blocks were all thinking carries `stop_reason` in its `message_delta` frame and no content at all, so the
  // candidate that found it is discarded for having nothing to show — and the fact would go with it.
  let stopReason: string | null = null;

  for (const read of candidates) {
    const decoded = read();

    if (decoded === null) {
      continue;
    }

    stopReason ??= decoded.stopReason;

    if (hasMessagesContent(decoded)) {
      return { ...decoded, stopReason: decoded.stopReason ?? stopReason };
    }
  }

  return { ...NO_MESSAGES_RESPONSE, stopReason };
};

const messagesShapeOf = (source: ResponseSource): DecodedResponse => {
  const decoded = messagesResponseOf(source);

  return {
    text: decoded.text,
    // Thinking blocks are this dialect's reasoning, and stating them separately is its own change: merged
    // into the answer they would misattribute the model's scratch work as its reply.
    reasoningText: null,
    status: decoded.stopReason ?? finishReasonOf(source),
    toolCalls: decoded.toolCalls,
  };
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

  // The messages dialect states the cache read directly in `usage`, with no details member to look under.
  return numberIn(usage, 'cache_read_input_tokens') ?? numberIn(details, 'cached_tokens');
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

// A stream states its facts across two frames rather than in one: the opening frame names the model and the
// response, and a later frame reports the usage. Reading only the frame that carries usage would leave every
// streamed hop of the messages dialect without a model on its facts line.
const frameFactsOf = (frames: unknown[], source: ResponseSource): HopResponseFacts => {
  const records = frames.filter(isRecord);
  const opening = factsIn(records.find((frame) => isRecord(frame.message))?.message ?? null);
  const withUsage = records.findLast((frame) => isRecord(frame.usage));
  const closing = factsIn(withUsage ?? responsesCompletedFrameOf(frames) ?? source.parsedRawOf());

  return {
    model: closing.model ?? opening.model,
    completionId: closing.completionId ?? opening.completionId,
    promptTokens: closing.promptTokens ?? opening.promptTokens,
    completionTokens: closing.completionTokens ?? opening.completionTokens,
    cachedTokens: closing.cachedTokens ?? opening.cachedTokens,
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

  return frameFactsOf(source.framesOf(), source);
};

// Assembled is what the client received, and it is read from the assembled column wherever the caller's
// schema reports it — averaging 1 511 characters against 52.8 KB for the raw body. Where that column is absent
// the same decode the response side uses recovers it from the raw body, so an instance predating it is
// not left without a response.
// Unstructured, not absent: on a failed hop those bytes are the error payload, and reporting them as "recorded
// nothing" is the dead end this state exists to avoid.
const emptyStateOf = (recordedBytes: number | null): HopReadState =>
  (recordedBytes ?? 0) > 0 ? HopReadState.Unstructured : HopReadState.NoBody;

// One mapping from dialect to decoder, for the same reason the request side has one: a dialect parsed on one
// half of a hop and fallen through on the other opens the hop, renders its history, and reports its answer as
// absent while the answer sits in the recorded body one tab away.
const shapeOf = (dialect: HopDialect, row: ConversationEntryBodyRow, source: ResponseSource): DecodedResponse => {
  if (dialect === HopDialect.Responses) {
    return responsesShapeOf(source);
  }

  return dialect === HopDialect.Messages ? messagesShapeOf(source) : chatShapeOf(row, source);
};

export const responseEnvelopeOf = (row: ConversationEntryBodyRow, dialect: HopDialect): HopResponseEnvelope => {
  const source = sourceOf(row);
  const decoded = shapeOf(dialect, row, source);
  const { status, toolCalls } = decoded;
  const text = withoutBlankEdges(decoded.text);
  const reasoningText = withoutBlankEdges(decoded.reasoningText);
  // A byte budget clamped by bytes: handing `RAW_BODY_BYTE_BUDGET` to the *character* clamp is a different
  // unit and so silently a different limit.
  const clamped = clampToBudget(text, RAW_BODY_BYTE_BUDGET);
  const hasContent = text !== null || reasoningText !== null || toolCalls.length > 0;
  const recordedBytes =
    row.response_body === null || row.response_body === undefined ? null : textByteLength(row.response_body);

  return {
    state: hasContent ? HopReadState.Available : emptyStateOf(recordedBytes),
    text: clamped.text,
    textClamp: clamped.clamp,
    reasoningText,
    finishReason: status,
    toolCalls,
    errorText: errorMessageIn(source.assembled) ?? errorMessageIn(source.parsedRawOf()),
    facts: factsOf(source),
    recordedBytes,
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
