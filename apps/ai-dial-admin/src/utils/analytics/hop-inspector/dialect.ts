import { HopDialect, HopDialectMessage } from '@/src/models/analytics/conversations-trace';
import { chatCompletionsMessagesOf } from '@/src/utils/analytics/hop-inspector/chat-completions';
import { withoutBlankEdges } from '@/src/utils/analytics/hop-inspector/envelope';
import { messagesDialectMessagesOf } from '@/src/utils/analytics/hop-inspector/messages';
import { responsesMessagesOf } from '@/src/utils/analytics/hop-inspector/responses';

// Endpoint markers, in the order they are tested. The mapping stays deliberately partial: `/v1/completions`
// recorded zero hops in two weeks and is left on the raw fallback, and any endpoint absent from this list
// resolves to `Unknown` rather than going through the nearest-looking parser. Parsing a Responses body as a
// chat-completions body would render a confidently wrong message list.
const DIALECT_MARKERS: [string, HopDialect][] = [
  ['/chat/completions', HopDialect.ChatCompletions],
  ['/v1/messages', HopDialect.Messages],
  ['/v1/responses', HopDialect.Responses],
];

export const dialectOf = (requestUri: string | null): HopDialect => {
  const uri = requestUri?.trim() ?? '';

  return DIALECT_MARKERS.find(([marker]) => uri.includes(marker))?.[1] ?? HopDialect.Unknown;
};

const DIALECT_PARSER: Record<HopDialect, (parsed: unknown) => HopDialectMessage[]> = {
  [HopDialect.ChatCompletions]: chatCompletionsMessagesOf,
  [HopDialect.Messages]: messagesDialectMessagesOf,
  [HopDialect.Responses]: responsesMessagesOf,
  // Reached only by a caller that ignored the state; an unknown dialect is answered with the raw view.
  [HopDialect.Unknown]: () => [],
};

// The blank edges are dropped here rather than in each parser or at each render: this is the one path every
// message text takes, for all three dialects and for both the envelope and the tier-2 read of one message in
// full, so a turn cannot arrive trimmed through one route and untrimmed through the other.
export const messagesForDialect = (dialect: HopDialect, parsed: unknown): HopDialectMessage[] =>
  DIALECT_PARSER[dialect](parsed).map((message) => ({ ...message, text: withoutBlankEdges(message.text) }));
