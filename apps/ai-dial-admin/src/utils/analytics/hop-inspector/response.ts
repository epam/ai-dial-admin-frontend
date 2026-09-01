import { RAW_BODY_BYTE_BUDGET } from '@/src/constants/analytics/conversations-trace';
import {
  ConversationEntryBodyRow,
  HopDialect,
  HopRawBody,
  HopReadState,
  HopResponseEnvelope,
} from '@/src/models/analytics/conversations-trace';
import { assistantTextOf, sseFrames, toolCallNamesOf } from '@/src/utils/analytics/conversation-bodies';
import {
  clampToBudget,
  isRecord,
  NO_CLAMP,
  parseJson,
  textByteLength,
} from '@/src/utils/analytics/hop-inspector/envelope';
import {
  responsesCompletedFrameOf,
  responsesOutputTextOf,
  responsesReasoningTextOf,
  responsesToolCallNamesOf,
  responsesStatusOf,
} from '@/src/utils/analytics/hop-inspector/responses';

const finishReasonIn = (body: string | null): string | null => {
  const parsed = parseJson(body);
  if (!isRecord(parsed) || !Array.isArray(parsed.choices)) {
    return null;
  }

  const [choice] = parsed.choices;

  return isRecord(choice) && typeof choice.finish_reason === 'string' ? choice.finish_reason : null;
};

// Falls back to the recorded body for the same reason the text does: the assembled column is a later addition
// to the hop log, and an instance predating it carries the finish reason only in the raw response.
const finishReasonOf = (row: ConversationEntryBodyRow): string | null =>
  finishReasonIn(row.assembled_response ?? null) ?? finishReasonIn(row.response_body ?? null);

interface DecodedResponse {
  text: string | null;
  reasoningText: string | null;
  status: string | null;
  toolCalls: string[];
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
  toolCalls: responsesToolCallNamesOf(source),
});

const responsesShapeOf = (row: ConversationEntryBodyRow): DecodedResponse => {
  const fromAssembled = decodeResponsesShape(parseJson(row.assembled_response ?? null));

  // Reasoning and a tool call both count as content: a hop that spent its budget reasoning, or that called a
  // tool and said nothing, records no message item — and testing the answer alone would fall through and
  // discard what is actually there.
  if (fromAssembled.text !== null || fromAssembled.reasoningText !== null || fromAssembled.toolCalls.length > 0) {
    return fromAssembled;
  }

  const raw = row.response_body?.trim() ?? '';
  if (!raw) {
    return fromAssembled;
  }

  return decodeResponsesShape(responsesCompletedFrameOf(sseFrames(raw).map(parseJson)) ?? parseJson(raw));
};

const chatShapeOf = (row: ConversationEntryBodyRow): DecodedResponse => ({
  text: assistantTextOf(row),
  reasoningText: null,
  status: finishReasonOf(row),
  toolCalls: toolCallNamesOf(row.response_body ?? null),
});

// Assembled is what the client received, and it is read from the assembled column wherever the caller's
// schema reports it — averaging 1 511 characters against 52.8 KB for the raw body. Where that column is absent
// the same decode the transcript uses recovers it from the raw body, so an instance predating the column is
// not left without a response.
export const responseEnvelopeOf = (row: ConversationEntryBodyRow, dialect: HopDialect): HopResponseEnvelope => {
  const { text, reasoningText, status, toolCalls } =
    dialect === HopDialect.Responses ? responsesShapeOf(row) : chatShapeOf(row);
  // A byte budget clamped by bytes. This previously handed `RAW_BODY_BYTE_BUDGET` to the *character* clamp,
  // which is a different unit and so silently a different limit.
  const clamped = clampToBudget(text, RAW_BODY_BYTE_BUDGET);
  const hasContent = text !== null || reasoningText !== null || toolCalls.length > 0;

  return {
    state: hasContent ? HopReadState.Available : HopReadState.NoBody,
    text: clamped.text,
    textClamp: clamped.clamp,
    reasoningText,
    finishReason: status,
    toolCalls,
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
