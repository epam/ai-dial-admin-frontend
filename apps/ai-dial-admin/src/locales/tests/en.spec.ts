import { describe, expect, test } from 'vitest';

import * as i18nEnums from '@/src/constants/i18n';
import en from '@/src/locales/en';

// The enums are the inventory: a key is added there and used through `t()`, so a translation that was
// never written shows up in the console as the raw key and in no test — the mocked `t()` in a component
// spec returns the key whether or not `en.ts` carries one. Reading the enums back is what catches it.
const declaredKeys = Object.values(i18nEnums)
  .flatMap((member) => (typeof member === 'object' && member !== null ? Object.values(member) : []))
  .filter((key): key is string => typeof key === 'string');

// A pluralised key is stored as one entry per CLDR category (`Key#other`), and `t()` picks among them by
// count, so the bare key is never a member of the file.
const PLURAL_CATEGORIES = ['zero', 'one', 'two', 'few', 'many', 'other'];

const read = (key: string): unknown =>
  key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], en);

const resolve = (key: string): unknown => {
  const direct = read(key);
  if (direct != null) return direct;

  const plural = PLURAL_CATEGORIES.map((category) => read(`${key}#${category}`)).find((value) => value != null);
  return plural;
};

describe('en locale', () => {
  test('carries a translation for every key the i18n enums declare', () => {
    expect(declaredKeys.filter((key) => typeof resolve(key) !== 'string')).toEqual([]);
  });

  test('declares the keys it is asked for', () => {
    expect(declaredKeys.length).toBeGreaterThan(0);
  });

  test('names auto routers in navigation and entity actions without renaming routes', () => {
    expect(en.Menu.PlatformRouters).toBe('Auto Routers');
    expect(en.Menu.PlatformRoutes).toBe('Routes');
    expect(en.Menu.AiGatewayDescription).toContain('auto routers');
    expect(en.Entities.RouterDisplayName).toBe('Auto Router display name');
    expect(en.DeleteEntity.Entities.Router).toBe('Auto Router');
    expect(en.DeleteEntity.BulkDelete.Routers).toBe('Auto Routers');
    expect(en.DuplicateEntity.Entities.Router).toBe('Auto Router');
    expect(en.CreateEntity.Entities.Router).toBe('Auto Router');
    expect(en.UpdateEntity.Entities.Router).toBe('Auto Router');
    expect(en.FileManager.Router).toBe('Auto Router');
    expect(en.FileManager.Routers).toBe('Auto Routers');
    expect(en.FileManager.Route).toBe('Route');
    expect(en.FileManager.Routes).toBe('Routes');
  });

  test('uses auto router terminology in guidance and aliases', () => {
    expect(en.FileManager.RoutersEmptyStateTitle).toBe("You don't have any auto routers");
    expect(en.FileManager.RoutersEmptyStateDescription).toBe('Create an auto router using the Create button');
    expect(en.ForwardToken.UseForThisRouter).toBe('Use for this auto router');
    expect(en.Interfaces.InfoDecisionMode).toBe(
      'An auto router in decision mode serves no interface through a translator',
    );
    expect(en.SessionsTrace.DeploymentsHint).toContain('models alongside auto routers');
    expect(en.Alias.TargetTypeRouter).toBe('Auto Router');
    expect(en.Alias.SelectRouterTarget).toBe('Select auto router');
    expect(en.Alias.PresentAsRouter).toBe('Auto Router');
  });
});
