import { HopDialectMessage, MessageRole } from '@/src/models/analytics/conversations-trace';
import { asRecords, isRecord, jsonByteLength, roleOf } from '@/src/utils/analytics/hop-inspector/envelope';

const INPUT_TEXT_PART = 'input_text';
const MESSAGE_ITEM = 'message';
const REASONING_ITEM = 'reasoning';
const OUTPUT_TEXT_PART = 'output_text';
const SUMMARY_TEXT_PART = 'summary_text';
const FUNCTION_CALL_ITEM = 'function_call';
const COMPLETED_EVENT = 'response.completed';

// The third dialect in a row to carry its system prompt outside the message list — `instructions` here,
// `system` in the messages dialect, a `system`-role message only in chat completions. Measured on 180 of 199
// hops.
const instructionsMessageOf = (instructions: unknown): HopDialectMessage | null => {
  if (typeof instructions !== 'string' || !instructions.length) {
    return null;
  }

  return {
    role: MessageRole.System,
    text: instructions,
    toolCalls: [],
    bytes: jsonByteLength(instructions),
  };
};

const textOfParts = (parts: Record<string, unknown>[], type: string): string | null => {
  const texts = parts
    .filter((part) => part.type === type)
    .map((part) => part.text)
    .filter((text): text is string => typeof text === 'string');

  return texts.length ? texts.join('') : null;
};

// `input` is a string on most hops and an array on 13 of 199 — not rare enough to defer. An array item is a
// message with typed `input_text` parts; an item shape this frontend does not recognise still renders, as the
// deny-list rule requires, carrying whatever text it has and its size regardless.
const inputMessagesOf = (input: unknown): HopDialectMessage[] => {
  if (typeof input === 'string') {
    return [{ role: MessageRole.User, text: input, toolCalls: [], bytes: jsonByteLength(input) }];
  }

  return asRecords(input).map((item) => {
    const parts = asRecords(item.content);

    return {
      role: roleOf(item.role),
      text: parts.length ? textOfParts(parts, INPUT_TEXT_PART) : typeof item.content === 'string' ? item.content : null,
      toolCalls: [],
      bytes: jsonByteLength(item),
    };
  });
};

export const responsesMessagesOf = (parsed: unknown): HopDialectMessage[] => {
  if (!isRecord(parsed)) {
    return [];
  }

  const instructions = instructionsMessageOf(parsed.instructions);
  const messages = inputMessagesOf(parsed.input);

  return instructions ? [instructions, ...messages] : messages;
};

// The answer, taken from `output[]` rather than from `choices[].message` — the shape this dialect records even
// though it lands in the same `assembled_response` column. A `reasoning` item is not the answer: it carries a
// `summary_text` and a null `content`, and 107 of 199 hops record one.
export const responsesOutputTextOf = (parsed: unknown): string | null => {
  if (!isRecord(parsed)) {
    return null;
  }

  const texts = asRecords(parsed.output)
    .filter((item) => item.type === MESSAGE_ITEM)
    .flatMap((item) => textOfParts(asRecords(item.content), OUTPUT_TEXT_PART) ?? []);

  return texts.length ? texts.join('') : null;
};

export const responsesReasoningTextOf = (parsed: unknown): string | null => {
  if (!isRecord(parsed)) {
    return null;
  }

  const summaries = asRecords(parsed.output)
    .filter((item) => item.type === REASONING_ITEM)
    .flatMap((item) => textOfParts(asRecords(item.summary), SUMMARY_TEXT_PART) ?? []);

  return summaries.length ? summaries.join('\n') : null;
};

// A `function_call` output item is what the model asked for, and only a `message` item carries text — so a
// hop that called a tool and said nothing would render its reasoning and leave the call invisible. Rare
// (1 of 472 sampled) but not absent, and the same defect as an assistant message whose content is empty.
export const responsesToolCallNamesOf = (parsed: unknown): string[] => {
  if (!isRecord(parsed)) {
    return [];
  }

  return asRecords(parsed.output)
    .filter((item) => item.type === FUNCTION_CALL_ITEM)
    .map((item) => (typeof item.name === 'string' ? item.name : ''))
    .filter((name) => name.length > 0);
};

// This shape states `status`, never `finish_reason`.
export const responsesStatusOf = (parsed: unknown): string | null =>
  isRecord(parsed) && typeof parsed.status === 'string' ? parsed.status : null;

// A stream frames its events by name — `response.output_text.delta` and the rest — but the terminal
// `response.completed` frame carries the whole `response` object, so decoding that reuses the non-streaming
// path instead of accumulating deltas.
export const responsesCompletedFrameOf = (frames: unknown[]): unknown =>
  frames.filter(isRecord).find((frame) => frame.type === COMPLETED_EVENT)?.response ?? null;
