const JSON_INDENT = 2;

// One serialisation for both halves of a hop, so a reader never meets one indented and the other on a line.
export const formatJsonValue = (value: unknown): string => JSON.stringify(value, null, JSON_INDENT);

// The unchanged answer is half the contract: plain text, and a document a clamp cut mid-structure, are both
// content that still has to render — reformatting never becomes the reason something recorded goes unstated.
export const formatJsonText = (text: string): string => {
  try {
    return formatJsonValue(JSON.parse(text));
  } catch {
    return text;
  }
};
