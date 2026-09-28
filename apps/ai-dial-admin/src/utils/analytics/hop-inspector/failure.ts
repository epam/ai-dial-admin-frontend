import { isRecord } from '@/src/utils/analytics/hop-inspector/envelope';

/**
 * The message a recorded error states, from either shape the log stores.
 *
 * A JSON-RPC error object carries it under `error.message` and a dialect's error object under its own
 * `message`; a body recorded as a bare JSON string is already that sentence. Stating the whole object instead
 * buries one readable line in envelope fields the reader did not ask for — the code and the rest stay one
 * switch away in the recorded bytes.
 *
 * A body matching none of them yields nothing rather than a fragment: rendering bytes at a reader presents
 * transport detail as a message, which is the same defect on a failed hop as on a successful one.
 */
export const errorMessageIn = (parsed: unknown): string | null => {
  if (typeof parsed === 'string') {
    return parsed.trim() || null;
  }

  if (!isRecord(parsed)) {
    return null;
  }

  // `{"error": "…"}` is the third shape the log stores: it carries the sentence directly, with no member to
  // look under, so it is read before the object form.
  if (typeof parsed.error === 'string') {
    return parsed.error.trim() || null;
  }

  const error = isRecord(parsed.error) ? parsed.error : parsed;
  const message = error.message;

  return typeof message === 'string' && message.trim() ? message : null;
};
