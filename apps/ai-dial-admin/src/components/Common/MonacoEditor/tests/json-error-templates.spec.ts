import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

import { describe, expect, test } from 'vitest';

import {
  JSON_ERROR_KEYS_BY_CODE,
  JSON_ERROR_TEMPLATES,
  MONACO_TRANSLATED_LOCALES,
} from '@/src/components/Common/MonacoEditor/constants';
import en from '@/src/locales/en';

// These read the installed `monaco-editor`, so a version bump that rewords a message or empties a locale bundle
// fails here instead of silently reverting that text to English.
const monacoRoot = dirname(createRequire(import.meta.url).resolve('monaco-editor/package.json'));
const languageServiceRoot = join(monacoRoot, 'esm/external/vscode-json-languageservice/lib/esm');

const languageServiceSource = ['parser/jsonParser.js', 'services/jsonValidation.js']
  .map((file) => readFileSync(join(languageServiceRoot, file), 'utf8'))
  .join('\n');

describe('JSON error templates', () => {
  test.each(JSON_ERROR_TEMPLATES.map(({ template }) => template))(
    '"%s" is still a message of the installed JSON language service',
    (template) => {
      expect(languageServiceSource).toContain(template);
    },
  );

  test.each(Object.values(JSON_ERROR_KEYS_BY_CODE))('the English text of %s is still a message of it', (key) => {
    const [, name] = key.split('.');

    expect(languageServiceSource).toContain(en.MonacoJsonError[name as keyof typeof en.MonacoJsonError]);
  });
});

describe('MONACO_TRANSLATED_LOCALES', () => {
  test.each(MONACO_TRANSLATED_LOCALES)('the installed %s bundle carries translations', (locale) => {
    const bundle = readFileSync(join(monacoRoot, `esm/nls.messages.${locale}.js`), 'utf8');
    const messages = bundle.slice(bundle.indexOf('_VSCODE_NLS_MESSAGES=['));

    expect(messages).toMatch(/^_VSCODE_NLS_MESSAGES=\["/);
  });
});
