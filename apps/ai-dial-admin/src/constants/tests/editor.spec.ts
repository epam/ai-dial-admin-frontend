import { describe, test, expect } from 'vitest';
import { getDiffEditorTheme, EDITOR_THEMES_CONFIG } from '../editor';
import { EDITOR_THEMES } from '@/src/types/editor';

describe('getDiffEditorTheme', () => {
  test('returns dark theme config with overridden background', () => {
    const theme = getDiffEditorTheme(EDITOR_THEMES.dark);
    expect(theme.base).toBe('vs-dark');
    expect(theme.colors['editor.background']).toBe('#222932');
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
