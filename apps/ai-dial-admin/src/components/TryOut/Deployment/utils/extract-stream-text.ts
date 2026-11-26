import { SseEvent } from '@/src/components/TryOut/utils/sse-parser';

const RESPONSES_TEXT_EVENT = 'response.output_text.delta';
const MESSAGES_TEXT_EVENT = 'content_block_delta';

const isRecord = (value: unknown): value is Record<string, unknown> => value != null && typeof value === 'object';

const getEventText = ({ event, data }: SseEvent): string => {
  if (!isRecord(data)) {
    return '';
  }
  if (event === RESPONSES_TEXT_EVENT) {
    return typeof data.delta === 'string' ? data.delta : '';
  }
  if (event === MESSAGES_TEXT_EVENT) {
    return isRecord(data.delta) && typeof data.delta.text === 'string' ? data.delta.text : '';
  }
  const choice = Array.isArray(data.choices) ? data.choices[0] : undefined;
  const content = isRecord(choice) && isRecord(choice.delta) ? choice.delta.content : undefined;

  return typeof content === 'string' ? content : '';
};

/** The reply text a stream of chat completions, Responses or Messages events adds up to. */
export const extractStreamText = (events: SseEvent[]): string => events.map(getEventText).join('');
