import { describe, test, expect } from 'vitest';
import { getModalTitle } from '../utils';
import { ApplicationRoute } from '@/src/types/routes';
import { PromptsI18nKey, FoldersI18nKey, ApplicationsI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';

describe('getModalTitle', () => {
  const t = (key) => key;

  test('returns Prompts export title', () => {
    expect(getModalTitle(ApplicationRoute.Prompts, t)).toBe(PromptsI18nKey.Export);
  });

  test('returns Files export title', () => {
    expect(getModalTitle(ApplicationRoute.Files, t)).toBe(FoldersI18nKey.Export);
  });

  test('returns Applications export title', () => {
    expect(getModalTitle(ApplicationRoute.AssetsApplications, t)).toBe(ApplicationsI18nKey.Export);
  });

  test('returns Toolsets export title', () => {
    expect(getModalTitle(ApplicationRoute.AssetsToolsets, t)).toBe(ToolsetI18nKey.Export);
  });

  test('returns empty string for unknown route', () => {
    expect(getModalTitle(undefined, t)).toBe('');
  });
});
