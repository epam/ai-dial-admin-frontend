const TRACEPARENT_PATTERN = /^(?!ff)[0-9a-f]{2}-([0-9a-f]{32})-[0-9a-f]{16}-[0-9a-f]{2}(?:-.*)?$/;
const EMPTY_TRACE_ID = '0'.repeat(32);

/** The trace id of a W3C `traceparent` header value, or `null` when it is absent, malformed or all zeros. */
export const parseTraceparent = (value: string | null | undefined): string | null => {
  const traceId = TRACEPARENT_PATTERN.exec(value?.trim().toLowerCase() ?? '')?.[1];

  return traceId && traceId !== EMPTY_TRACE_ID ? traceId : null;
};
