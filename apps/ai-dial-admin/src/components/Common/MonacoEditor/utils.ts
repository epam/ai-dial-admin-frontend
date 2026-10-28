import { JSON_ERROR_KEYS_BY_CODE, JSON_ERROR_TEMPLATES } from '@/src/components/Common/MonacoEditor/constants';
import type {
  JsonErrorTemplate,
  JsonMarkerMessage,
  MonacoTranslate,
} from '@/src/components/Common/MonacoEditor/models';

interface CompiledTemplate extends JsonErrorTemplate {
  pattern: RegExp;
}

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// `{n}` becomes a lazy capture; the rest of the template must match literally, start to end.
const compileTemplate = (template: JsonErrorTemplate): CompiledTemplate => ({
  ...template,
  pattern: new RegExp(`^${escapeRegExp(template.template).replace(/\\\{\d+\\\}/g, '(.+?)')}$`),
});

const COMPILED_TEMPLATES = JSON_ERROR_TEMPLATES.map(compileTemplate);

const getMarkerCode = (marker: JsonMarkerMessage): string | undefined =>
  typeof marker.code === 'string' ? marker.code : marker.code?.value;

const translateByTemplate = (message: string, t: MonacoTranslate): string | undefined => {
  for (const { key, pattern, params = [] } of COMPILED_TEMPLATES) {
    const match = pattern.exec(message);
    if (match) {
      const options = Object.fromEntries(params.map((param, index) => [param, match[index + 1]]));
      return t(key, options);
    }
  }
  return undefined;
};

/**
 * Translates a message the JSON language service reported. A syntax error is identified by its code; any other
 * message by its English wording. A message neither identifies is returned as Monaco reported it.
 */
export const translateJsonMarkerMessage = (marker: JsonMarkerMessage, t: MonacoTranslate): string => {
  const code = getMarkerCode(marker);
  const key = code == null ? undefined : JSON_ERROR_KEYS_BY_CODE[code];
  if (key != null) {
    return t(key);
  }
  return translateByTemplate(marker.message, t) ?? marker.message;
};
