import { ConversationEntryBodyRow, MessageRole } from '@/src/models/analytics/conversations-trace';

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

const TRANSCRIPT_ROLES = new Set<string>([MessageRole.User, MessageRole.Assistant]);

export interface RecordedMessage {
  role: MessageRole;
  content: string | undefined;
}

export const transcriptMessagesOf = (requestBody: string | null): RecordedMessage[] => {
  const parsed = requestBody ? parseJson(requestBody) : null;
  if (!isRecord(parsed)) {
    return [];
  }

  return asRecords(parsed.messages)
    .filter((message) => typeof message.role === 'string' && TRANSCRIPT_ROLES.has(message.role))
    .map((message) => ({ role: message.role as MessageRole, content: messageTextOf(message) }));
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

export interface ToolCallRequest {
  name: string;
  args: string | null;
}

const toolRequestsOfMessage = (message: Record<string, unknown>): ToolCallRequest[] =>
  asRecords(message.tool_calls)
    .map((call) => (isRecord(call.function) ? call.function : null))
    .filter((fn): fn is Record<string, unknown> => fn !== null)
    .map((fn) => ({
      name: typeof fn.name === 'string' ? fn.name : '',
      args: typeof fn.arguments === 'string' ? fn.arguments : null,
    }))
    .filter(({ name }) => name.length > 0);

// A streamed response carries no `message.tool_calls`: each chunk contributes a fragment under
// `delta.tool_calls`, keyed by an `index` naming the call slot it belongs to.
const streamedToolRequestsOf = (raw: string): ToolCallRequest[] => {
  const slots = new Map<number, { name: string; args: string }>();

  for (const frame of sseFrames(raw)) {
    const parsed = parseJson(frame);
    if (!isRecord(parsed)) {
      continue;
    }

    for (const choice of asRecords(parsed.choices)) {
      for (const call of asRecords(isRecord(choice.delta) ? choice.delta.tool_calls : null)) {
        const index = typeof call.index === 'number' ? call.index : 0;
        const fn = isRecord(call.function) ? call.function : {};
        const slot = slots.get(index) ?? { name: '', args: '' };

        slots.set(index, {
          name: typeof fn.name === 'string' && fn.name ? fn.name : slot.name,
          args: slot.args + (typeof fn.arguments === 'string' ? fn.arguments : ''),
        });
      }
    }
  }

  return [...slots.entries()]
    .sort(([left], [right]) => left - right)
    .map(([, { name, args }]) => ({ name, args: args || null }))
    .filter(({ name }) => name.length > 0);
};

export const toolCallRequestsOf = (body: string | null): ToolCallRequest[] => {
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

export const lastRequestMessageOf = (requestBody: string | null): string | null => {
  const messages = transcriptMessagesOf(requestBody);

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const text = messages[index].content?.trim();
    if (text) {
      return text;
    }
  }

  return null;
};
