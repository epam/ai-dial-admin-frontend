import { trace, context } from '@opentelemetry/api';

export function getTraceId(): string {
  const span = trace.getSpan(context.active());
  return span?.spanContext().traceId ?? crypto.randomUUID();
}
