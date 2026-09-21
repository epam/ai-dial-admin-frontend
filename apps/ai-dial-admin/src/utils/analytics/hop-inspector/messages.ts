import {
  HopDialectMessage,
  HopMessagesResponse,
  HopToolCall,
  MessageRole,
} from '@/src/models/analytics/sessions-trace';
import { asRecords, isRecord, jsonByteLength, parseJson, roleOf } from '@/src/utils/analytics/hop-inspector/envelope';

const TEXT_BLOCK = 'text';
const TEXT_DELTA = 'text_delta';
const INPUT_JSON_DELTA = 'input_json_delta';
const BLOCK_START_FRAME = 'content_block_start';
const BLOCK_DELTA_FRAME = 'content_block_delta';
const MESSAGE_DELTA_FRAME = 'message_delta';
const TOOL_USE_BLOCK = 'tool_use';
const TOOL_RESULT_BLOCK = 'tool_result';

const textOfBlock = (block: Record<string, unknown>): string | null =>
  typeof block.text === 'string' ? block.text : null;

// A tool result is content being fed back, not metadata: its own content is either a string or a further list
// of blocks, and either way it is what that message said.
const textOfToolResult = (block: Record<string, unknown>): string | null => {
  if (typeof block.content === 'string') {
    return block.content;
  }

  const parts = asRecords(block.content)
    .map(textOfBlock)
    .filter((text): text is string => text !== null);

  return parts.length ? parts.join('') : null;
};

const blockTextOf = (blocks: Record<string, unknown>[]): string | null => {
  const parts = blocks
    .map((block) => {
      if (block.type === TEXT_BLOCK) {
        return textOfBlock(block);
      }

      return block.type === TOOL_RESULT_BLOCK ? textOfToolResult(block) : null;
    })
    .filter((text): text is string => text !== null);

  return parts.length ? parts.join('') : null;
};

// `JSON.stringify` is typed `string` but returns `undefined` for a value it cannot represent, so the `?? null`
// is what makes the declared `string | null` true rather than merely intended.
const argsOf = (input: unknown): string | null =>
  input === undefined ? null : (JSON.stringify(input, null, 2) ?? null);

// `tool_use` is this dialect's spelling of a tool call: 95% of sampled hops carry one, and the arguments live
// under `input` as an object rather than as a JSON string.
const blockToolCallsOf = (blocks: Record<string, unknown>[]): HopToolCall[] =>
  blocks
    .filter((block) => block.type === TOOL_USE_BLOCK)
    .map((block) => ({
      name: typeof block.name === 'string' ? block.name : '',
      args: argsOf(block.input),
      id: typeof block.id === 'string' ? block.id : null,
    }))
    .filter(({ name }) => name.length > 0);

// This dialect feeds several results back inside one message, each block quoting the call it answers, so the
// pairing is a list. Taking the first alone would leave every result after it anonymous.
const answeredCallIdsOf = (blocks: Record<string, unknown>[]): string[] =>
  blocks
    .filter((block) => block.type === TOOL_RESULT_BLOCK)
    .map((block) => block.tool_use_id)
    .filter((id): id is string => typeof id === 'string');

// A result that reported a failure. Any failing block marks the message: the blocks were merged into one text
// on the way in, so there is no per-block surface left to mark instead — and a reader debugging an agent loop
// needs to see that something failed more than they need to know which block it was.
const hasErrorResult = (blocks: Record<string, unknown>[]): boolean =>
  blocks.some((block) => block.type === TOOL_RESULT_BLOCK && block.is_error === true);

const systemMessageOf = (system: unknown): HopDialectMessage | null => {
  if (system == null) {
    return null;
  }

  const text = typeof system === 'string' ? system : blockTextOf(asRecords(system));

  return {
    role: MessageRole.System,
    text,
    toolCalls: [],
    bytes: jsonByteLength(system),
    answeredCallIds: [],
    isError: false,
  };
};

// The messages dialect carries its system prompt as a top-level field rather than as a message — 99.5% of a
// 399-hop sample — and its message content as a list of typed blocks. Both are normalised into the same shape
// the OpenAI dialect produces, so the panel and every test above it read one shape and a reader never has to
// know which dialect they are looking at.
export const messagesDialectMessagesOf = (parsed: unknown): HopDialectMessage[] => {
  if (!isRecord(parsed)) {
    return [];
  }

  const system = systemMessageOf(parsed.system);

  const messages = asRecords(parsed.messages).map((message) => {
    const blocks = Array.isArray(message.content) ? asRecords(message.content) : [];

    if (!blocks.length) {
      return {
        role: roleOf(message.role),
        text: typeof message.content === 'string' ? message.content : null,
        toolCalls: [],
        bytes: jsonByteLength(message),
        answeredCallIds: [],
        isError: false,
      };
    }

    return {
      role: roleOf(message.role),
      text: blockTextOf(blocks),
      toolCalls: blockToolCallsOf(blocks),
      bytes: jsonByteLength(message),
      answeredCallIds: answeredCallIdsOf(blocks),
      isError: hasErrorResult(blocks),
    };
  });

  return system ? [system, ...messages] : messages;
};

const stopReasonIn = (value: unknown): string | null =>
  isRecord(value) && typeof value.stop_reason === 'string' ? value.stop_reason : null;

export const NO_MESSAGES_RESPONSE: HopMessagesResponse = { text: null, toolCalls: [], stopReason: null };

// The merged form: one assistant message whose typed blocks are the same ones the request side reads, so the
// block readers above serve both halves of the hop rather than being duplicated for the response.
export const messagesMergedResponseOf = (parsed: unknown): HopMessagesResponse => {
  if (!isRecord(parsed)) {
    return NO_MESSAGES_RESPONSE;
  }

  const blocks = asRecords(parsed.content);

  return {
    text: blockTextOf(blocks),
    toolCalls: blockToolCallsOf(blocks),
    stopReason: stopReasonIn(parsed),
  };
};

// Streamed arguments arrive as JSON text in fragments, so a body cut mid-call leaves a fragment that does not
// parse. It is stated as recorded rather than discarded: a truncated argument list still says what the model
// was asking for, and dropping it would report the call as having asked for nothing.
const streamedArgsOf = (args: string): string | null => {
  if (!args.length) {
    return null;
  }

  const parsed = parseJson(args);

  return parsed === null ? args : argsOf(parsed);
};

/**
 * The streamed form, accumulated.
 *
 * Unlike the Responses dialect, this one never restates the finished message: the text exists only as the
 * concatenation of its `text_delta` fragments, and a call's arguments only as the `input_json_delta`
 * fragments that follow the frame naming it. The block index is the slot key — the same role
 * `tool_calls[].index` plays in the streamed chat-completions decoder — because several blocks stream
 * interleaved and a single accumulator would splice one call's arguments into another's.
 */
export const messagesStreamedResponseOf = (frames: unknown[]): HopMessagesResponse => {
  const texts: string[] = [];
  const calls = new Map<number, { name: string; args: string; id: string | null }>();
  let stopReason: string | null = null;

  for (const frame of frames.filter(isRecord)) {
    const index = typeof frame.index === 'number' ? frame.index : 0;
    const block = isRecord(frame.content_block) ? frame.content_block : {};
    const delta = isRecord(frame.delta) ? frame.delta : {};

    if (frame.type === BLOCK_START_FRAME && block.type === TOOL_USE_BLOCK) {
      calls.set(index, {
        name: typeof block.name === 'string' ? block.name : '',
        args: '',
        id: typeof block.id === 'string' ? block.id : null,
      });
    }

    if (frame.type === BLOCK_DELTA_FRAME && delta.type === TEXT_DELTA && typeof delta.text === 'string') {
      texts.push(delta.text);
    }

    // A fragment for a block no frame opened has no call to belong to: its name and id were never recorded,
    // and inventing a slot for it would state a nameless call.
    const slot = calls.get(index);

    if (frame.type === BLOCK_DELTA_FRAME && delta.type === INPUT_JSON_DELTA && slot) {
      calls.set(index, {
        ...slot,
        args: slot.args + (typeof delta.partial_json === 'string' ? delta.partial_json : ''),
      });
    }

    if (frame.type === MESSAGE_DELTA_FRAME) {
      stopReason = stopReasonIn(frame.delta) ?? stopReason;
    }
  }

  return {
    text: texts.length ? texts.join('') : null,
    toolCalls: [...calls.entries()]
      .sort(([left], [right]) => left - right)
      .map(([, { name, args, id }]) => ({ name, args: streamedArgsOf(args), id }))
      .filter(({ name }) => name.length > 0),
    stopReason,
  };
};
