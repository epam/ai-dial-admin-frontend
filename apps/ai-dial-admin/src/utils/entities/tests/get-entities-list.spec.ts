import { getEntitiesList } from '../get-entities-list';
import { EntityType } from '@/src/types/entity-type';
import { MenuI18nKey } from '@/src/constants/i18n';
import { describe, expect, test, vi } from 'vitest';

describe('Utils :: getEntitiesList', () => {
  const t = vi.fn((key: string) => `translated:${key}`);

  test('returns the correct list of entities with translated names', () => {
    const entities = getEntitiesList(t);

    expect(Array.isArray(entities)).toBe(true);
    expect(entities).toHaveLength(9);

    expect(entities).toEqual([
      { id: EntityType.MODEL, name: `translated:${MenuI18nKey.Models}` },
      { id: EntityType.APPLICATION, name: `translated:${MenuI18nKey.Applications}` },
      { id: EntityType.ROUTE, name: `translated:${MenuI18nKey.Routes}` },
      { id: EntityType.ROLE, name: `translated:${MenuI18nKey.Roles}` },
      { id: EntityType.KEY, name: `translated:${MenuI18nKey.Keys}` },
      { id: EntityType.APPLICATION_TYPE_SCHEMA, name: `translated:${MenuI18nKey.ApplicationRunners}` },
      { id: EntityType.INTERCEPTOR, name: `translated:${MenuI18nKey.Interceptors}` },
      { id: EntityType.PROMPT, name: `translated:${MenuI18nKey.Prompts}` },
      { id: EntityType.FILE, name: `translated:${MenuI18nKey.Files}` },
    ]);
  });

  test('calls the translation function with the correct keys', () => {
    getEntitiesList(t);
    expect(t).toHaveBeenCalledWith(MenuI18nKey.Models);
    expect(t).toHaveBeenCalledWith(MenuI18nKey.Applications);
    expect(t).toHaveBeenCalledWith(MenuI18nKey.Routes);
    expect(t).toHaveBeenCalledWith(MenuI18nKey.Roles);
    expect(t).toHaveBeenCalledWith(MenuI18nKey.Keys);
    expect(t).toHaveBeenCalledWith(MenuI18nKey.ApplicationRunners);
    expect(t).toHaveBeenCalledWith(MenuI18nKey.Interceptors);
    expect(t).toHaveBeenCalledWith(MenuI18nKey.Prompts);
    expect(t).toHaveBeenCalledWith(MenuI18nKey.Files);
  });
});
