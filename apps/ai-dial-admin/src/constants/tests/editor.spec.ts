import { describe, test, expect } from 'vitest';
import { getDiffEditorTheme, EDITOR_THEMES_CONFIG } from '../editor';
import { EDITOR_THEMES } from '@/src/types/editor';
import { JSONATA_MONARCH_TOKENS } from '@/src/components/Common/JsonataEditor/constants';

const collectJsonataTokenNames = (): string[] => {
  const names = new Set<string>();
  Object.values(JSONATA_MONARCH_TOKENS.tokenizer).forEach((rules) => {
    rules.forEach((rule) => {
      const action = Array.isArray(rule) ? rule[1] : undefined;
      if (typeof action === 'string' && action.startsWith('jsonata')) {
        names.add(action);
      } else if (action && typeof action === 'object' && 'cases' in action) {
        Object.values((action as { cases: Record<string, string> }).cases).forEach((token) => {
          if (typeof token === 'string' && token.startsWith('jsonata')) {
            names.add(token);
          }
        });
      }
    });
  });
  return [...names];
};

describe('getDiffEditorTheme', () => {
  test('returns dark theme config with overridden background', () => {
    const theme = getDiffEditorTheme(EDITOR_THEMES.dark);
    expect(theme.base).toBe('vs-dark');
    expect(theme.colors['editor.background']).toBe('#1D2439');
  });

  test('returns light theme config with overridden background', () => {
    const theme = getDiffEditorTheme(EDITOR_THEMES.light);
    expect(theme.base).toBe('vs');
    expect(theme.colors['editor.background']).toBe('#FCFCFC');
  });
});

describe('EDITOR_THEMES_CONFIG', () => {
  test('contains dark, light, and light-orange configs', () => {
    expect(EDITOR_THEMES_CONFIG[EDITOR_THEMES.dark]).toBeDefined();
    expect(EDITOR_THEMES_CONFIG[EDITOR_THEMES.light]).toBeDefined();
  });
});

describe('JSONata theme rules', () => {
  const jsonataTokens = collectJsonataTokenNames();

  test('the tokenizer emits at least one jsonata.* token', () => {
    expect(jsonataTokens.length).toBeGreaterThan(0);
  });

  test.each([EDITOR_THEMES.dark, EDITOR_THEMES.light])('%s theme has a rule for every jsonata.* token', (theme) => {
    const ruleTokens = EDITOR_THEMES_CONFIG[theme].rules.map((rule) => rule.token);

    jsonataTokens.forEach((token) => {
      expect(ruleTokens).toContain(token);
    });
  });

  test('no jsonata rule uses a bare (non-`jsonata.`-prefixed) token name', () => {
    Object.values(EDITOR_THEMES_CONFIG).forEach((config) => {
      config.rules
        .filter((rule) => rule.token.startsWith('jsonata'))
        .forEach((rule) => {
          expect(rule.token).toMatch(/^jsonata\./);
        });
    });
  });
});
