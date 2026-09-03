import { RAW_BODY_BYTE_BUDGET } from '@/src/constants/analytics/conversations-trace';
import {
  ConversationEntryBodyRow,
  HopProtocolFacts,
  HopReadState,
  HopSideGrants,
} from '@/src/models/analytics/conversations-trace';
import { jsonRpcParamsOf, jsonRpcResultOf } from '@/src/utils/analytics/conversation-bodies';
import { NO_CLAMP, clampToBudget, textByteLength } from '@/src/utils/analytics/hop-inspector/envelope';
import { formatJsonValue } from '@/src/utils/analytics/hop-inspector/json-text';

interface ProtocolInput {
  row: ConversationEntryBodyRow;
  method: string | null;
  grants: HopSideGrants;
}

const sideState = (isReadable: boolean): HopReadState =>
  isReadable ? HopReadState.NoBody : HopReadState.ColumnWithheld;

// Both halves as the JSON they were recorded as. An earlier pass decoded each method into named facts, which
// described a response instead of showing one. The size stated is the recorded one, not the formatted form.
export const protocolFactsOf = ({ row, method, grants }: ProtocolInput): HopProtocolFacts => {
  const params = grants.isRequestReadable ? jsonRpcParamsOf(row.request_body) : null;
  const requestText = params === null ? null : formatJsonValue(params);

  const result = grants.isResponseReadable ? jsonRpcResultOf(row.response_body) : null;
  const recorded = result === null ? null : JSON.stringify(result);
  const clamped =
    recorded === null
      ? { text: null, clamp: NO_CLAMP }
      : clampToBudget(formatJsonValue(result), RAW_BODY_BYTE_BUDGET, textByteLength(recorded));

  return {
    state: requestText !== null || clamped.text !== null ? HopReadState.Available : sideState(grants.isRequestReadable),
    method: method?.trim() || null,
    requestText,
    requestState: requestText === null ? sideState(grants.isRequestReadable) : HopReadState.Available,
    resultText: clamped.text,
    resultClamp: clamped.clamp,
    responseState: clamped.text === null ? sideState(grants.isResponseReadable) : HopReadState.Available,
  };
};
