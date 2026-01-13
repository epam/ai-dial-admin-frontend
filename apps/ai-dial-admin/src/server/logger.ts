import pino from 'pino';
import pretty from 'pino-pretty';
import { context, trace } from '@opentelemetry/api';

const stream = pretty({
  colorize: true,
  messageFormat: '{msg} [trace_id={trace_id}, span_id={span_id}]',
  translateTime: 'yyyy-mm-dd HH:MM:ss.l o',
});

const logger = pino(stream);

export const getCurrentTraceIds = () => {
  const span = trace.getSpan(context.active());
  return {
    trace_id: span?.spanContext().traceId ?? 'no-trace',
    span_id: span?.spanContext().spanId ?? 'no-span',
  };
};

export const logWithTrace = (msg: string, level: 'info' | 'error' | 'warn' = 'info') => {
  const traceIds = getCurrentTraceIds();
  logger[level]({ ...traceIds }, msg);
};

export const logErrorText = (message: string, context: Record<string, unknown> = {}) => {
  logError({}, message, context);
};

export const logError = (error: unknown, message: string, context: Record<string, unknown> = {}) => {
  const errorMessage = (error as { message: string }).message
    ? (error as { message: string }).message
    : 'Unknown error';
  const errorStack = (error as { error: string }) ? (error as { error: string }).error : 'No stack trace available';
  const traceIds = getCurrentTraceIds();

  logger.error(
    {
      ...traceIds,
      error: {
        message: errorMessage,
        stack: errorStack,
      },
      ...context,
    },
    message,
  );
};
