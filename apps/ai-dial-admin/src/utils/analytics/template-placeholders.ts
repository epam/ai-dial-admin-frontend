// The service's own pattern, so the console reads a template exactly as the validator does — a
// looser one would report a placeholder the service never sees, and a stricter one would miss a
// name it refuses.
const PLACEHOLDER_PATTERN = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g;

export const extractPlaceholders = (template?: string): string[] => {
  if (!template) return [];

  const names = new Set<string>();
  for (const match of template.matchAll(PLACEHOLDER_PATTERN)) {
    names.add(match[1]);
  }

  return [...names];
};
