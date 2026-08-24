import { MCP_EVENT_KIND } from '@/src/constants/analytics/conversations-trace';
import { ConversationEntryBodyRow, ConversationHopTexts } from '@/src/models/analytics/conversations-trace';
import {
  assistantTextOf,
  decodeResponseBody,
  jsonRpcArgumentsOf,
  lastRequestMessageOf,
  toolCallNamesOf,
} from '@/src/utils/analytics/conversation-bodies';

export const hopTextsOf = (row: ConversationEntryBodyRow): ConversationHopTexts => {
  const isMcp = row.event_kind?.trim() === MCP_EVENT_KIND;

  return {
    sent: isMcp ? jsonRpcArgumentsOf(row.request_body) : lastRequestMessageOf(row.request_body),
    received: isMcp ? decodeResponseBody(row) : assistantTextOf(row),
    toolCalls: toolCallNamesOf(row.response_body),
  };
};
