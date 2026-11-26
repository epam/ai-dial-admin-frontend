export interface SseEvent {
  event?: string;
  data: unknown;
}

const EVENT_SEPARATOR = /\r?\n\r?\n/;
const DONE_MARKER = '[DONE]';

const parseData = (data: string): unknown => {
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
};

const parseBlock = (block: string): SseEvent | null => {
  let event: string | undefined;
  const dataLines: string[] = [];

  block.split(/\r?\n/).forEach((line) => {
    if (line.startsWith('event:')) {
      event = line.slice('event:'.length).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).replace(/^ /, ''));
    }
  });

  const data = dataLines.join('\n');
  if (dataLines.length === 0 || data === DONE_MARKER) {
    return null;
  }

  return event ? { event, data: parseData(data) } : { data: parseData(data) };
};

/**
 * Incremental parser for a server-sent-event stream. `push` takes the next decoded chunk, which may end in the
 * middle of an event, and returns the events it completed; `flush` returns the last one when the stream ends
 * without a closing blank line.
 */
export const createSseParser = () => {
  let buffer = '';

  return {
    push(chunk: string): SseEvent[] {
      buffer += chunk;
      const blocks = buffer.split(EVENT_SEPARATOR);
      buffer = blocks.pop() ?? '';

      return blocks.map(parseBlock).filter((event): event is SseEvent => event != null);
    },
    flush(): SseEvent[] {
      const rest = buffer;
      buffer = '';
      const event = parseBlock(rest);

      return event ? [event] : [];
    },
  };
};
