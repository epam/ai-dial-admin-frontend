import pino from 'pino';
import pretty from 'pino-pretty';

const stream = pretty({
  colorize: true,
  messageFormat: '{msg} [trace_id={trace_id}, span_id={span_id}]',
  translateTime: 'yyyy-mm-dd HH:MM:ss.l o',
});

export const logger = pino(stream);

export const logError = (error: unknown, message: string, context: Record<string, unknown> = {}) => {
  const errorMessage = (error as { message: string }).message
    ? (error as { message: string }).message
    : 'Unknown error';
  const errorStack = (error as { error: string }) ? (error as { error: string }).error : 'No stack trace available';

  logger.error(
    {
      error: {
        message: errorMessage,
        stack: errorStack,
      },
      ...context,
    },
    message,
  );
};
