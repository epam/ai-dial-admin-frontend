import pino from 'pino';
import pretty from 'pino-pretty';
import { context, trace } from '@opentelemetry/api';
import { logs } from '@opentelemetry/api-logs';

const stream = pretty({
  colorize: true,
  messageFormat: '{msg} [trace_id={trace_id}, span_id={span_id}]',
  translateTime: 'yyyy-mm-dd HH:MM:ss.l o',
});

const logger = pino(stream);

const otelLogger = logs.getLogger('otel-pino-logger');

export const getCurrentTraceIds = () => {
  const span = trace.getSpan(context.active());
  return {
    trace_id: span?.spanContext().traceId ?? 'no-trace',
    span_id: span?.spanContext().spanId ?? 'no-span',
  };
};

export const errorObjLog = (error: unknown, message: string) => {
  const traceIds = getCurrentTraceIds();

  const errorMessage = (error as { message?: string })?.message ?? 'Unknown error';
  const errorStack = (error as { stack?: string })?.stack ?? 'No stack trace available';

  otelLogger.emit({
    body: message,
    ...traceIds,
  });

  logger.error(
    {
      ...traceIds,
      error: {
        message: errorMessage,
        stack: errorStack,
      },
    },
    message,
  );
};
export const errorLog = (message: string) => {
  const traceIds = getCurrentTraceIds();

  otelLogger.emit({ body: message, ...traceIds });
  logger.error({ ...traceIds }, message);
};

export const warnLog = (message: string) => {
  const traceIds = getCurrentTraceIds();

  otelLogger.emit({ body: message, ...traceIds });
  logger.warn({ ...traceIds }, message);
};

export const infoLog = (message: string) => {
  const traceIds = getCurrentTraceIds();

  otelLogger.emit({ body: message, ...traceIds });
  logger.info({ ...traceIds }, message);
};
