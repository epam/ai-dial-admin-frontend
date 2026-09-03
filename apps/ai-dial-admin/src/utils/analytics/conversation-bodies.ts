import { ConversationEntryBodyRow, HopToolCall } from '@/src/models/analytics/conversations-trace';

const SSE_DATA_PREFIX = 'data:';
const SSE_DONE = '[DONE]';

const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asRecords = (value: unknown): Record<string, unknown>[] => (Array.isArray(value) ? value.filter(isRecord) : []);

export const messageTextOf = (message: Record<string, unknown>): string | undefined => {
  if (!('content' in message)) {
    return undefined;
  }

  const content = message.content;

  if (typeof content === 'string') {
    return content;
  }

  const parts = asRecords(content)
    .map((part) => part.text)
    .filter((text): text is string => typeof text === 'string');

  return parts.length ? parts.join('') : undefined;
};

const firstChoiceMessage = (parsed: unknown): Record<string, unknown> | null => {
  if (!isRecord(parsed)) {
    return null;
  }
  const [choice] = asRecords(parsed.choices);
  return choice && isRecord(choice.message) ? choice.message : null;
};

export const sseFrames = (raw: string): string[] =>
  raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith(SSE_DATA_PREFIX))
    .map((line) => line.slice(SSE_DATA_PREFIX.length).trim())
    .filter((payload) => payload.length > 0 && payload !== SSE_DONE);

export const decodeStreamedChunks = (raw: string): string | null => {
  const frames = sseFrames(raw);
  if (!frames.length) {
    return null;
  }

  const text = frames
    .map(parseJson)
    .flatMap((chunk) => asRecords(isRecord(chunk) ? chunk.choices : null))
    .map((choice) => (isRecord(choice.delta) ? choice.delta.content : null))
    .filter((content): content is string => typeof content === 'string')
    .join('');

  return text;
};

export const decodeSingleCompletion = (raw: string): string | null => {
  const message = firstChoiceMessage(parseJson(raw));
  if (!message) {
    return null;
  }

  return messageTextOf(message) ?? '';
};

export const decodeJsonRpcStream = (raw: string): string | null => {
  const frames = sseFrames(raw);
  if (!frames.length) {
    return null;
  }

  const text = frames
    .map(parseJson)
    .filter(isRecord)
    .flatMap((frame) => asRecords(isRecord(frame.result) ? frame.result.content : null))
    .map((part) => part.text)
    .filter((value): value is string => typeof value === 'string')
    .join('');

  return text;
};

export const decodeResponseBody = (row: ConversationEntryBodyRow): string | null => {
  const raw = row.response_body?.trim();
  if (!raw) {
    return null;
  }

  if (raw.startsWith(SSE_DATA_PREFIX) || raw.includes(`\n${SSE_DATA_PREFIX}`)) {
    return decodeJsonRpcStream(raw) || decodeStreamedChunks(raw);
  }

  return decodeSingleCompletion(raw);
};

export const assistantTextOf = (row: ConversationEntryBodyRow): string | null => {
  const assembled = row.assembled_response?.trim();

  if (assembled) {
    const message = firstChoiceMessage(parseJson(assembled));
    const text = message ? messageTextOf(message) : undefined;

    if (text) {
      return text;
    }
  }

  return decodeResponseBody(row);
};

export const toolCallNamesOf = (body: string | null): string[] => toolCallRequestsOf(body).map(({ name }) => name);

// This response is where a call's id is minted; the next request's result quotes it back.
const toolRequestsOfMessage = (message: Record<string, unknown>): HopToolCall[] =>
  asRecords(message.tool_calls)
    .filter((call) => isRecord(call.function))
    .map((call) => {
      const fn = call.function as Record<string, unknown>;

      return {
        name: typeof fn.name === 'string' ? fn.name : '',
        args: typeof fn.arguments === 'string' ? fn.arguments : null,
        id: typeof call.id === 'string' ? call.id : null,
      };
    })
    .filter(({ name }) => name.length > 0);

// A streamed response carries no `message.tool_calls`: each chunk contributes a fragment under
// `delta.tool_calls`, keyed by an `index` naming the call slot it belongs to.
const streamedToolRequestsOf = (raw: string): HopToolCall[] => {
  const slots = new Map<number, { name: string; args: string; id: string | null }>();

  for (const frame of sseFrames(raw)) {
    const parsed = parseJson(frame);
    if (!isRecord(parsed)) {
      continue;
    }

    for (const choice of asRecords(parsed.choices)) {
      for (const call of asRecords(isRecord(choice.delta) ? choice.delta.tool_calls : null)) {
        const index = typeof call.index === 'number' ? call.index : 0;
        const fn = isRecord(call.function) ? call.function : {};
        const slot = slots.get(index) ?? { name: '', args: '', id: null };

        slots.set(index, {
          name: typeof fn.name === 'string' && fn.name ? fn.name : slot.name,
          args: slot.args + (typeof fn.arguments === 'string' ? fn.arguments : ''),
          // Only the first chunk of a slot names the call, and only it carries the id.
          id: typeof call.id === 'string' && call.id ? call.id : slot.id,
        });
      }
    }
  }

  return [...slots.entries()]
    .sort(([left], [right]) => left - right)
    .map(([, { name, args, id }]) => ({ name, args: args || null, id }))
    .filter(({ name }) => name.length > 0);
};

export const toolCallRequestsOf = (body: string | null): HopToolCall[] => {
  const raw = body?.trim();
  if (!raw) {
    return [];
  }

  const message = firstChoiceMessage(parseJson(raw));
  const fromMessage = message ? toolRequestsOfMessage(message) : [];

  return fromMessage.length ? fromMessage : streamedToolRequestsOf(raw);
};

export const jsonRpcArgumentsOf = (requestBody: string | null): string | null => {
  const parsed = parseJson(requestBody ?? '');
  if (!isRecord(parsed) || !isRecord(parsed.params)) {
    return null;
  }

  const { params } = parsed;
  const args = isRecord(params.arguments) ? params.arguments : params;

  return Object.keys(args).length ? JSON.stringify(args, null, 2) : null;
};
