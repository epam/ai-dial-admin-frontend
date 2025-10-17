import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test } from 'vitest';
import { isSimpleEntity } from '../is-simple-entity';

describe('Utils :: isSimpleEntity', () => {
  test('Should check complex entity', () => {
    expect(isSimpleEntity(ApplicationRoute.Models)).toBeFalsy();
    expect(isSimpleEntity(ApplicationRoute.Applications)).toBeFalsy();
    expect(isSimpleEntity(ApplicationRoute.Toolsets)).toBeFalsy();
    expect(isSimpleEntity(ApplicationRoute.AssetsToolsets)).toBeFalsy();
    expect(isSimpleEntity(ApplicationRoute.AssetsApplications)).toBeFalsy();
  });

  test('Should check simple entity', () => {
    expect(isSimpleEntity(ApplicationRoute.Roles)).toBeTruthy();
  });
});
