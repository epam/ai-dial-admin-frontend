import { describe, expect, test } from 'vitest';
import { isDialBaseEntity } from '../base-dial-entity';

describe('Utils :: isDialBaseEntity', () => {
  test('Should check entity', () => {
    const res1 = isDialBaseEntity({ name: 'name' });
    const res2 = isDialBaseEntity({ key: 'key' });

    expect(res1).toBeTruthy();
    expect(res2).toBeFalsy();
  });
});
