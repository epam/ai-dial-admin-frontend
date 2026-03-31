import { ParsedValue, ViewerContentType } from '@/src/models/evaluation/detail-panel';

export const parseValue = (value: string): ParsedValue => {
  const raw = value;

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      const preview = parsed.length > 0 ? JSON.stringify(parsed[0]).slice(0, 120) : '';
      return {
        displayText: preview ? `${preview}...` : '[]',
        rawText: JSON.stringify(parsed, null, 2),
        typeChip: `Array\u00B7${parsed.length}`,
        isLong: true,
      };
    }
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        displayText: JSON.stringify(parsed).slice(0, 120) + '...',
        rawText: JSON.stringify(parsed, null, 2),
        typeChip: `Object`,
        isLong: true,
      };
    }
  } catch {
    // Not JSON — treat as plain string
  }

  return {
    displayText: raw,
    rawText: raw,
    isLong: raw.length > 100,
  };
};

export const formatContent = (content: string, contentType: ViewerContentType): string => {
  if (contentType === 'json') {
    try {
      return JSON.stringify(JSON.parse(content), null, 2);
    } catch {
      return content;
    }
  }
  // For text: try to parse as JSON if it looks like JSON, otherwise return as-is
  // Also handle escaped newlines
  return content.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
};

export const beautifyValue = (val: unknown): string => {
  if (val == null) return String(val);
  if (typeof val === 'object') return JSON.stringify(val, null, 2);
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (typeof parsed === 'object') return JSON.stringify(parsed, null, 2);
    } catch {
      // not JSON
    }
    return val;
  }
  return String(val);
};
