import { HopDialectMessage, HopToolCall } from '@/src/models/analytics/conversations-trace';
import { messageTextOf } from '@/src/utils/analytics/conversation-bodies';
import { asRecords, isRecord, jsonByteLength, roleOf } from '@/src/utils/analytics/hop-inspector/envelope';

// A request message's calls sit on the message itself, not under `choices[].message` — so the response-side
// decoder in `conversation-bodies.ts` does not apply here, and this is the one shape it does not already read.
const toolCallsOf = (message: Record<string, unknown>): HopToolCall[] =>
  asRecords(message.tool_calls)
    .map((call) => (isRecord(call.function) ? call.function : null))
    .filter((fn): fn is Record<string, unknown> => fn !== null)
    .map((fn) => ({
      name: typeof fn.name === 'string' ? fn.name : '',
      args: typeof fn.arguments === 'string' ? fn.arguments : null,
    }))
    .filter(({ name }) => name.length > 0);

// The OpenAI dialect: one flat `messages` array whose members carry their own role, and whose content is
// either a string or a list of content parts.
export const chatCompletionsMessagesOf = (parsed: unknown): HopDialectMessage[] => {
  if (!isRecord(parsed)) {
    return [];
  }

  return asRecords(parsed.messages).map((message) => ({
    role: roleOf(message.role),
    text: messageTextOf(message) ?? null,
    toolCalls: toolCallsOf(message),
    bytes: jsonByteLength(message),
  }));
};
