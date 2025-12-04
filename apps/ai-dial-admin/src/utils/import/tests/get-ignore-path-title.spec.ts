import { describe, test, expect } from 'vitest';
import { getIgnorePathTitles } from '../get-ignore-path-title';
import { ApplicationRoute } from '@/src/types/routes';
import { ImportI18nKey, ToolsetI18nKey, ApplicationsI18nKey } from '@/src/constants/i18n';

describe('getIgnorePathTitles', () => {
  const t = (key: string) => key;

  test('returns prompt paths title', () => {
    expect(getIgnorePathTitles(ApplicationRoute.Prompts, t)).toBe(ImportI18nKey.PromptPaths);
  });

  test('returns file paths title', () => {
    expect(getIgnorePathTitles(ApplicationRoute.Files, t)).toBe(ImportI18nKey.FilePaths);
  });

  test('returns toolset path title', () => {
    expect(getIgnorePathTitles(ApplicationRoute.AssetsToolsets, t)).toBe(ToolsetI18nKey.ToolsetPath);
  });

  test('returns application paths title', () => {
    expect(getIgnorePathTitles(ApplicationRoute.AssetsApplications, t)).toBe(ApplicationsI18nKey.ApplicationPaths);
  });

  test('returns empty string for unknown route', () => {
    expect(getIgnorePathTitles(undefined, t)).toBe('');
  });
});
