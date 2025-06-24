import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test } from 'vitest';
import { isSimpleEntity } from '../is-simple-entity';

describe('Utils :: isSimpleEntity', () => {
  test('Should check complex entity', () => {
    const res1 = isSimpleEntity(ApplicationRoute.Models);
    const res2 = isSimpleEntity(ApplicationRoute.Applications);
    const res3 = isSimpleEntity(ApplicationRoute.Assistants);

    expect(res1).toBeFalsy();
    expect(res2).toBeFalsy();
    expect(res3).toBeFalsy();
  });

  test('Should check simple entity', () => {
    const res1 = isSimpleEntity(ApplicationRoute.Roles);

    expect(res1).toBeTruthy();
  });
});
