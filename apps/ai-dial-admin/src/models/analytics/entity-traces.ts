import { SessionTraceGroup } from '@/src/models/analytics/sessions-trace';

// One call to an entity, read for the card it becomes. The page query projects it directly, so the card needs
// no second read: unlike a session listing, which pages traces and then looks up their roots, the unit here is
// the call row itself.
export interface EntityCallRow {
  trace_id: string;
  core_span_id: string;
  request_time: number | string | null;
  operation_duration_ms: number | string | null;
  success: boolean | null;
  response_status: number | null;
  total_tokens: number | string | null;
  total_price: number | string | null;
  deployment_price: number | string | null;
  request_uri: string | null;
  event_kind: string | null;
  number_request_messages: number | string | null;
  deployment: string | null;
  parent_deployment: string | null;
  project_id: string | null;
}

// The last call a page ended on. The next page is read strictly after it, by start time and then span id, so a
// call recorded meanwhile cannot shift what the next page returns.
export interface EntityTraceCursor {
  requestTime: number;
  coreSpanId: string;
}

export interface EntityTracePage {
  groups: SessionTraceGroup[];
  hasMore: boolean;
  cursor: EntityTraceCursor | null;
}
