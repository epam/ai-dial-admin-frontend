import { ENVELOPE_BYTE_BUDGET, MESSAGE_TEXT_CLAMP } from '@/src/constants/analytics/conversations-trace';
import {
  HopClamp,
  HopDialect,
  HopDialectMessage,
  HopMessageEntry,
  HopParams,
  HopReadState,
  HopRequestEnvelope,
  HopToolCall,
  MessageRole,
} from '@/src/models/analytics/conversations-trace';

const encoder = new TextEncoder();

export const parseJson = (raw: string | null): unknown => {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const asRecords = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.filter(isRecord) : [];

// The size of the value as the log recorded it, not the length of the text rendered from it. The reader is
// asking what made a request 166 KB, and the serialized form is what the log actually stored — so a message
// whose text was clamped away entirely still states an honest size.
export const jsonByteLength = (value: unknown): number => encoder.encode(JSON.stringify(value ?? null)).length;

export const textByteLength = (text: string): number => encoder.encode(text).length;

export interface ClampedText {
  text: string;
  isClamped: boolean;
}

export const clampText = (text: string, limit = MESSAGE_TEXT_CLAMP): ClampedText =>
  text.length <= limit ? { text, isClamped: false } : { text: text.slice(0, limit), isClamped: true };

// Clamps by bytes rather than characters: the budget exists to bound what crosses the wire, and a character
// count says nothing about that for content that is mostly non-ASCII.
//
// One encode, one slice, one decode. The previous form sliced *characters* against a *byte* budget and then
// trimmed a character per pass, re-encoding the whole remainder each time — 241 980 iterations and 158 s of
// synchronous CPU for a 1.4 MB Cyrillic body, inside a server action, on the event loop the whole app shares.
// `stream: true` makes the decoder hold back an incomplete trailing sequence instead of emitting a
// replacement character for it, so a cut landing mid-character drops that character rather than showing U+FFFD
// — which is why the decoder is constructed per call: it carries that state.
export const clampBytes = (text: string, budget: number): ClampedText => {
  const bytes = encoder.encode(text);

  if (bytes.length <= budget) {
    return { text, isClamped: false };
  }

  return { text: new TextDecoder().decode(bytes.subarray(0, budget), { stream: true }), isClamped: true };
};

/**
 * Drops the blank lines at the two ends of recorded content.
 *
 * Content routinely opens with a newline: a templated prompt is assembled around its variables, and the
 * template's own leading break is part of the string. Measured over one hour of `llm_call` hops, 39 of 272
 * requests carried at least one message whose content began with one, and 20 of their assembled responses
 * did. Rendered with `whitespace-pre-wrap` — which is what makes the rest of a prompt readable — each of those
 * breaks costs a line, and a chat bubble that opens with an empty line reads as a rendering fault.
 *
 * Only lines that are **entirely** blank are dropped. `trim()` would also take the indentation of the first
 * line that does have content, which is exactly wrong for a message opening with a code block.
 *
 * Byte sizes and clamps are unaffected: they are measured against the recorded JSON, not against this.
 */
export const withoutBlankEdges = (text: string | null): string | null => {
  if (text === null) {
    return null;
  }

  const lines = text.split('\n');
  let start = 0;
  let end = lines.length;

  while (start < end && lines[start].trim() === '') {
    start += 1;
  }

  while (end > start && lines[end - 1].trim() === '') {
    end -= 1;
  }

  return lines.slice(start, end).join('\n');
};

interface ClampedToolCall {
  call: HopToolCall;
  cost: number;
  isArgsClamped: boolean;
}

// Arguments take the same clamp as the text. A call's arguments are content — they are what the assistant
// actually said when it said nothing else — so a call carrying a whole document must not walk past the budget
// the text respects.
const clampToolCall = ({ id, name, args }: HopToolCall): ClampedToolCall => {
  if (args === null) {
    return { call: { id, name, args: null }, cost: 0, isArgsClamped: false };
  }

  const { text, isClamped } = clampText(args);

  return { call: { id, name, args: text }, cost: textByteLength(text), isArgsClamped: isClamped };
};

const KNOWN_ROLES: Record<string, MessageRole> = {
  [MessageRole.System]: MessageRole.System,
  [MessageRole.User]: MessageRole.User,
  [MessageRole.Assistant]: MessageRole.Assistant,
  [MessageRole.Tool]: MessageRole.Tool,
};

// Roles come from parsed structure and nothing else. A substring test against the body would report a system
// prompt that does not exist: the literal `"role":"system"` occurs inside tool results and quoted transcripts
// in 43% of sampled messages-dialect bodies that carry no system role at all — and in a view that renders
// system prompts, that invents one out of a user's pasted text.
export const roleOf = (raw: unknown): MessageRole =>
  typeof raw === 'string' ? (KNOWN_ROLES[raw.trim().toLowerCase()] ?? MessageRole.Other) : MessageRole.Other;

export const roleCountsOf = (roles: MessageRole[]) => {
  const counts = new Map<MessageRole, number>();

  for (const role of roles) {
    counts.set(role, (counts.get(role) ?? 0) + 1);
  }

  return [...counts.entries()].map(([role, count]) => ({ role, count }));
};

interface EnvelopeInput {
  dialect: HopDialect;
  params: HopParams;
  messages: HopDialectMessage[];
  recordedBytes: number | null;
}

// Which tool each call id belongs to, across the whole message list. A result message carries only the id, so
// the pairing cannot be resolved from that message alone — and resolving it here rather than on the client
// means the tier-2 read of one message in full does not have to carry the list with it.
const toolNamesByCallId = (messages: HopDialectMessage[]): Map<string, string> => {
  const names = new Map<string, string>();

  for (const message of messages) {
    for (const { id, name } of message.toolCalls) {
      if (id !== null) {
        names.set(id, name);
      }
    }
  }

  return names;
};

// A per-message clamp alone does not bound what crosses the wire: the messages dialect averages 56.6 messages
// per request, and 280 characters each still assembles into more than the rail will ever show.
export const buildRequestEnvelope = ({
  dialect,
  params,
  messages,
  recordedBytes,
}: EnvelopeInput): HopRequestEnvelope => {
  let spent = 0;
  let isClamped = false;
  const toolNames = toolNamesByCallId(messages);

  const entries: HopMessageEntry[] = messages.map((message, index) => {
    const clamped = message.text === null ? null : clampText(message.text);
    const calls = message.toolCalls.map(clampToolCall);
    const cost = (clamped ? textByteLength(clamped.text) : 0) + calls.reduce((total, call) => total + call.cost, 0);
    const isWithinBudget = spent + cost <= ENVELOPE_BYTE_BUDGET;
    const hasContent = clamped !== null || calls.length > 0;

    if (hasContent && !isWithinBudget) {
      isClamped = true;
    }

    if (isWithinBudget) {
      spent += cost;
    }

    // Past the budget a message keeps its role, position, size and the *names* and ids of what it called — the
    // facts a reader decides from — and gives up only the text and the arguments, which tier 2 fetches one at
    // a time. The id costs a handful of characters and is what pairs the call with its result, so withholding
    // it would save nothing and cost the pairing.
    return {
      index,
      role: message.role,
      bytes: message.bytes,
      text: clamped && isWithinBudget ? clamped.text : null,
      toolCalls: isWithinBudget
        ? calls.map(({ call }) => call)
        : message.toolCalls.map(({ id, name }) => ({ id, name, args: null })),
      isTextClamped:
        !isWithinBudget || calls.some(({ isArgsClamped }) => isArgsClamped) || (clamped?.isClamped ?? false),
      // Never withheld past the budget either, for the reason above.
      answers: message.answeredCallIds.map((callId) => ({ callId, toolName: toolNames.get(callId) ?? null })),
      isError: message.isError,
    };
  });

  return {
    state: HopReadState.Available,
    dialect,
    params,
    messages: entries,
    roleCounts: roleCountsOf(entries.map(({ role }) => role)),
    recordedBytes,
    isClamped,
  };
};

export const NO_CLAMP: HopClamp = { isClamped: false, recordedBytes: null, deliveredBytes: null };

// The one way to clamp something a reader will be told about. Returning the numbers alongside the text is what
// makes the statement possible at the call site rather than optional.
export const clampToBudget = (text: string | null, budget: number): { text: string | null; clamp: HopClamp } => {
  if (text === null) {
    return { text: null, clamp: NO_CLAMP };
  }

  const recordedBytes = textByteLength(text);
  const clamped = clampBytes(text, budget);

  return {
    text: clamped.text,
    clamp: { isClamped: clamped.isClamped, recordedBytes, deliveredBytes: textByteLength(clamped.text) },
  };
};
