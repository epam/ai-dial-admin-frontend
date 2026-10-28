import { describe, expect, test, vi } from 'vitest';

import { JSON_ERROR_KEYS_BY_CODE, JSON_ERROR_TEMPLATES } from '@/src/components/Common/MonacoEditor/constants';
import type { MonacoTranslate } from '@/src/components/Common/MonacoEditor/models';
import { translateJsonMarkerMessage } from '@/src/components/Common/MonacoEditor/utils';
import { MonacoJsonErrorI18nKey } from '@/src/constants/i18n';
import en from '@/src/locales/en';

// Resolves a key against the real English locale, the way next-international fills `{param}`.
const englishT: MonacoTranslate = (key, options = {}) => {
  const [, name] = key.split('.');
  const text = en.MonacoJsonError[name as keyof typeof en.MonacoJsonError];
  return text.replace(/\{(\w+)\}/g, (match, param: string) => String(options[param] ?? match));
};

// Fills a Monaco template the way the JSON language service does: `{0}` → first value, and so on.
const fillTemplate = (template: string, values: string[]) =>
  template.replace(/\{(\d+)\}/g, (_match, index: string) => values[Number(index)]);

describe('translateJsonMarkerMessage', () => {
  test('translates a syntax error by its code', () => {
    const t = vi.fn(() => 'Ожидается запятая');

    const message = translateJsonMarkerMessage({ code: '514', message: 'Expected comma' }, t);

    expect(message).toBe('Ожидается запятая');
    expect(t).toHaveBeenCalledWith(MonacoJsonErrorI18nKey.CommaExpected);
  });

  test('reads a code given in its object form', () => {
    const t = vi.fn(() => 'translated');

    translateJsonMarkerMessage(
      { code: { value: '519', target: { toString: () => '' } as never }, message: 'Trailing comma' },
      t,
    );

    expect(t).toHaveBeenCalledWith(MonacoJsonErrorI18nKey.TrailingComma);
  });

  test('translates a schema message by its wording and passes its value as a named parameter', () => {
    const t = vi.fn(() => 'translated');

    translateJsonMarkerMessage({ code: undefined, message: 'Incorrect type. Expected "object".' }, t);

    expect(t).toHaveBeenCalledWith(MonacoJsonErrorI18nKey.IncorrectType, { type: 'object' });
  });

  test('passes every value of a message that carries two', () => {
    const t = vi.fn(() => 'translated');

    translateJsonMarkerMessage(
      { code: undefined, message: 'Object is missing property name required by property id.' },
      t,
    );

    expect(t).toHaveBeenCalledWith(MonacoJsonErrorI18nKey.MissingDependentProperty, {
      property: 'name',
      dependent: 'id',
    });
  });

  test('matches by wording when a syntax error shares the generic code 0', () => {
    const t = vi.fn(() => 'translated');

    translateJsonMarkerMessage({ code: '0', message: 'End of file expected.' }, t);

    expect(t).toHaveBeenCalledWith(MonacoJsonErrorI18nKey.EndOfFileExpected, {});
  });

  test('keeps a message it cannot identify as Monaco reported it', () => {
    const t = vi.fn(() => 'translated');

    const message = translateJsonMarkerMessage({ code: undefined, message: 'Schema author wrote this.' }, t);

    expect(message).toBe('Schema author wrote this.');
    expect(t).not.toHaveBeenCalled();
  });

  test('does not match a template that only appears inside a longer message', () => {
    const t = vi.fn(() => 'translated');

    const message = translateJsonMarkerMessage({ code: undefined, message: 'Note: Value is deprecated' }, t);

    expect(message).toBe('Note: Value is deprecated');
  });
});

describe('translateJsonMarkerMessage — English locale', () => {
  test.each(Object.entries(JSON_ERROR_KEYS_BY_CODE))('reads code %s exactly as Monaco words it', (code, key) => {
    const [, name] = key.split('.');
    const monacoText = en.MonacoJsonError[name as keyof typeof en.MonacoJsonError];

    expect(translateJsonMarkerMessage({ code, message: monacoText }, englishT)).toBe(monacoText);
  });

  test.each(JSON_ERROR_TEMPLATES.map((entry) => [entry.template, entry] as const))(
    'reads "%s" exactly as Monaco words it',
    (_template, { template, params = [] }) => {
      const monacoText = fillTemplate(
        template,
        params.map((_param, index) => `value${index}`),
      );

      expect(translateJsonMarkerMessage({ code: undefined, message: monacoText }, englishT)).toBe(monacoText);
    },
  );
});
