import { RAW_BODY_BYTE_BUDGET } from '@/src/constants/analytics/conversations-trace';
import {
  ConversationEntryBodyRow,
  HopMcpFacts,
  HopReadState,
  HopSideGrants,
} from '@/src/models/analytics/conversations-trace';
import { decodeResponseBody, jsonRpcArgumentsOf } from '@/src/utils/analytics/conversation-bodies';
import { NO_CLAMP, clampToBudget } from '@/src/utils/analytics/hop-inspector/envelope';

interface McpInput {
  row: ConversationEntryBodyRow;
  method: string | null;
  toolName: string | null;
  // The toolset is the hop's deployment: one measured conversation recorded all 277 of its MCP hops under a
  // single parent span, distinguishable only by it. There is no session column, so no session field is
  // stated — a field with no source is a field that gets filled with the wrong thing.
  toolset: string | null;
  grants: HopSideGrants;
}

// `tools/call` averages 5.5 KB in and 123 KB out, so the result takes the same clamp as any other raw content.
//
// The two sides are stated separately because they can be entitled separately: a caller granted the request
// column and not the response one gets real arguments and no result, and reporting that absence as "this hop
// recorded nothing" describes the caller's entitlement as a property of the hop.
export const mcpFactsOf = ({ row, method, toolName, toolset, grants }: McpInput): HopMcpFacts => {
  const argumentsText = grants.isRequestReadable ? jsonRpcArgumentsOf(row.request_body) : null;
  const clamped = grants.isResponseReadable
    ? clampToBudget(decodeResponseBody(row), RAW_BODY_BYTE_BUDGET)
    : { text: null, clamp: NO_CLAMP };
  const hasContent = argumentsText !== null || clamped.text !== null;

  const emptyState = grants.isRequestReadable ? HopReadState.NoBody : HopReadState.ColumnWithheld;
  const resultState = () => {
    if (!grants.isResponseReadable) {
      return HopReadState.ColumnWithheld;
    }

    return clamped.text === null ? HopReadState.NoBody : HopReadState.Available;
  };

  return {
    state: hasContent ? HopReadState.Available : emptyState,
    method,
    toolName,
    toolset,
    argumentsText,
    resultText: clamped.text,
    resultClamp: clamped.clamp,
    resultState: resultState(),
  };
};
