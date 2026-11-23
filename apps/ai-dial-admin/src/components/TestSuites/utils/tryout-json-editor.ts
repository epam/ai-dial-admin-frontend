import type { editor } from 'monaco-editor';

/** Props to drive a read-only try-out JsonEditor for a response body or events array. */
export interface TryOutJsonEditorProps {
  entity: object | null;
  text?: string;
  options: editor.IStandaloneEditorConstructionOptions;
}

const OFF_VALIDATION: editor.IStandaloneEditorConstructionOptions = {
  renderValidationDecorations: 'off',
};

/**
 * Maps a try-out response body (or events array) to JsonEditor props.
 *
 * - Object/array → `entity` (stringified by the editor).
 * - JSON string of an object/array → parsed into `entity`.
 * - Non-JSON or truncated string → raw `text` with validation decorations off
 *   so an interrupted stream still renders without Monaco schema errors.
 */
export const toTryOutJsonEditorProps = (
  value: unknown,
  baseOptions: editor.IStandaloneEditorConstructionOptions = { wordWrap: 'off' },
): TryOutJsonEditorProps => {
  if (value != null && typeof value === 'object') {
    const needsValidationOff = Array.isArray(value);
    return {
      entity: value as object,
      options: needsValidationOff ? { ...baseOptions, ...OFF_VALIDATION } : baseOptions,
    };
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed != null && typeof parsed === 'object') {
        const needsValidationOff = Array.isArray(parsed);
        return {
          entity: parsed as object,
          options: needsValidationOff ? { ...baseOptions, ...OFF_VALIDATION } : baseOptions,
        };
      }
    } catch {
      // Truncated / non-JSON stream body — fall through to text mode.
    }

    return {
      entity: null,
      text: value,
      options: { ...baseOptions, ...OFF_VALIDATION },
    };
  }

  return { entity: null, options: baseOptions };
};
