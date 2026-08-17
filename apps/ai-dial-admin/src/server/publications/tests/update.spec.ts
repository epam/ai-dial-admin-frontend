import { describe, expect, test } from 'vitest';

import { ActionType } from '@/src/models/dial/publications';
import { buildUpdatePlan } from '../update';

describe('Server :: Publications :: buildUpdatePlan — skill resources', () => {
  test('recalculates a skill resource target URL without queuing an asset PUT', () => {
    const publication = {
      path: 'public/req',
      requestName: 'My skill request',
      folderId: 'public/folder',
      rules: [],
      skillResources: [
        {
          action: ActionType.ADD,
          sourceUrl: 'skills/src/my-skill',
          targetUrl: 'skills/old/my-skill',
          reviewUrl: 'skills/review/my-skill',
          skillResource: { name: 'my-skill', path: 'review/my-skill' },
        },
      ],
    };

    const { dto, resourcePuts } = buildUpdatePlan(publication as never);

    expect(dto.resourceTypes).toEqual(['SKILL']);
    expect(dto.resources[0].targetUrl).toBe('skills/public/folder/my-skill');
    expect(resourcePuts).toEqual([]);
  });
});
