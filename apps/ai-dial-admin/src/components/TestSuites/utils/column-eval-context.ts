/**
 * Try-out resolved request bodies arrive as `{ contentType, content }` wrappers.
 * Column expressions expect the JSON payload (e.g. `$request.messages`).
 */
export const unwrapJsonRequestBody = (body?: Record<string, unknown>): Record<string, unknown> | undefined => {
  if (!body) {
    return body;
  }

  const { content, contentType } = body;
  if (
    typeof contentType === 'string' &&
    contentType.includes('json') &&
    content &&
    typeof content === 'object' &&
    !Array.isArray(content)
  ) {
    return content as Record<string, unknown>;
  }

  return body;
};

const parseEvent = (event: unknown): Record<string, unknown> | null => {
  if (event && typeof event === 'object' && !Array.isArray(event)) {
    return event as Record<string, unknown>;
  }
  if (typeof event === 'string') {
    try {
      const parsed = JSON.parse(event) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * Streaming try-out responses use `{ events: [...] }` instead of a chat.completion
 * object. Rebuild a minimal `choices[].message` shape so column expressions like
 * `$_response.choices[-1].message.content` resolve.
 */
export const normalizeResponseBodyForColumns = (
  body?: Record<string, unknown>,
): Record<string, unknown> | undefined => {
  if (!body) {
    return body;
  }

  if (Array.isArray(body.choices)) {
    return body;
  }

  const events = body.events;
  if (!Array.isArray(events) || events.length === 0) {
    return body;
  }

  let role = 'assistant';
  let content = '';
  let sawDelta = false;
  let completeChoice: Record<string, unknown> | null = null;

  for (const event of events) {
    const parsed = parseEvent(event);
    if (!parsed) {
      continue;
    }

    const choices = parsed.choices;
    if (!Array.isArray(choices)) {
      continue;
    }

    for (const choice of choices) {
      if (!choice || typeof choice !== 'object') {
        continue;
      }

      const choiceRecord = choice as Record<string, unknown>;
      if (choiceRecord.message && typeof choiceRecord.message === 'object') {
        completeChoice = choiceRecord;
      }

      const delta = choiceRecord.delta;
      if (delta && typeof delta === 'object') {
        sawDelta = true;
        const deltaRecord = delta as Record<string, unknown>;
        if (typeof deltaRecord.role === 'string') {
          role = deltaRecord.role;
        }
        if (typeof deltaRecord.content === 'string') {
          content += deltaRecord.content;
        }
      }
    }
  }

  if (completeChoice) {
    return { ...body, choices: [completeChoice] };
  }

  if (sawDelta) {
    return {
      ...body,
      choices: [
        {
          index: 0,
          finish_reason: 'stop',
          message: { role, content },
        },
      ],
    };
  }

  return body;
};
