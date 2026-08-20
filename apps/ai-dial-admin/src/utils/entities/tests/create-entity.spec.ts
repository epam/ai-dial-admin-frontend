import { describe, expect, test } from 'vitest';

import { CreateI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { getCreateEntityTitle, getCreateNotificationDescription, getCreateNotificationTitle } from '../create-entity';

const t = (key: string, options?: Record<string, string>) => (options ? `${key}:${JSON.stringify(options)}` : key);

describe('getCreateEntityTitle', () => {
  test('resolves the Skill entity label for AssetsSkills', () => {
    const result = getCreateEntityTitle(ApplicationRoute.AssetsSkills, t);

    expect(result).toBe(`${CreateI18nKey.Title}:${JSON.stringify({ entity: CreateI18nKey.Skill })}`);
  });
});

describe('getCreateNotificationTitle', () => {
  test('resolves the Skill entity label for AssetsSkills', () => {
    const result = getCreateNotificationTitle(ApplicationRoute.AssetsSkills, t);

    expect(result).toBe(`${CreateI18nKey.NotificationTitle}:${JSON.stringify({ entity: CreateI18nKey.Skill })}`);
  });
});

describe('getCreateNotificationDescription', () => {
  test('resolves the Skill entity label and entity id for AssetsSkills', () => {
    const result = getCreateNotificationDescription(ApplicationRoute.AssetsSkills, 'my-skill', t);

    expect(result).toBe(
      `${CreateI18nKey.NotificationDescription}:${JSON.stringify({ entity: CreateI18nKey.Skill, entityId: 'my-skill' })}`,
    );
  });
});
