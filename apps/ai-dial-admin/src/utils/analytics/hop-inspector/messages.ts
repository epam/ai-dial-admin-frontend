import { HopDialectMessage, HopToolCall, MessageRole } from '@/src/models/analytics/conversations-trace';
import { asRecords, isRecord, jsonByteLength, roleOf } from '@/src/utils/analytics/hop-inspector/envelope';

const TEXT_BLOCK = 'text';
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
    }))
    .filter(({ name }) => name.length > 0);

const systemMessageOf = (system: unknown): HopDialectMessage | null => {
  if (system == null) {
    return null;
  }

  const text = typeof system === 'string' ? system : blockTextOf(asRecords(system));

  return { role: MessageRole.System, text, toolCalls: [], bytes: jsonByteLength(system) };
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
      };
    }

    return {
      role: roleOf(message.role),
      text: blockTextOf(blocks),
      toolCalls: blockToolCallsOf(blocks),
      bytes: jsonByteLength(message),
    };
  });

  return system ? [system, ...messages] : messages;
};
