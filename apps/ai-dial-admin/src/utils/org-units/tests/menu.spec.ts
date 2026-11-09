import { describe, expect, test } from 'vitest';

import { MenuGroupConfiguration } from '@/src/components/Menu/menu-configuration';
import { MenuI18nKey } from '@/src/constants/i18n';
import { UnitNamespace } from '@/src/models/user-access';
import { ApplicationRoute } from '@/src/types/routes';
import { filterMenuForUnitMode } from '@/src/utils/org-units/menu';

const CONFIG: MenuGroupConfiguration[] = [
  {
    key: MenuI18nKey.Artifacts,
    descriptionKey: MenuI18nKey.ArtifactsDescription,
    items: [
      { key: MenuI18nKey.Prompts, href: ApplicationRoute.Prompts },
      { key: MenuI18nKey.Files, href: ApplicationRoute.Files },
      { key: MenuI18nKey.Projects, href: ApplicationRoute.Projects },
    ],
  },
  {
    key: MenuI18nKey.AiGateway,
    descriptionKey: MenuI18nKey.AiGatewayDescription,
    items: [{ key: MenuI18nKey.PlatformModels, href: ApplicationRoute.PlatformModels }],
  },
];

const FOLDERS_CONFIG: MenuGroupConfiguration[] = [
  {
    key: MenuI18nKey.Governance,
    descriptionKey: MenuI18nKey.GovernanceDescription,
    items: [{ key: MenuI18nKey.FoldersStorage, href: ApplicationRoute.FoldersStorage }],
  },
];

const allowed =
  (...namespaces: UnitNamespace[]) =>
  (namespace: UnitNamespace) =>
    namespaces.includes(namespace);

describe('filterMenuForUnitMode', () => {
  test('keeps only items whose namespace can be read', () => {
    const result = filterMenuForUnitMode(CONFIG, allowed(UnitNamespace.PROMPTS));

    expect(result).toHaveLength(1);
    expect(result[0].items.map((item) => item.href)).toEqual([ApplicationRoute.Prompts]);
  });

  test('shows Projects when the projects namespace can be read', () => {
    const result = filterMenuForUnitMode(CONFIG, allowed(UnitNamespace.PROJECTS));

    expect(result[0].items.map((item) => item.href)).toEqual([ApplicationRoute.Projects]);
  });

  test('drops items with no namespace, such as platform pages', () => {
    const result = filterMenuForUnitMode(CONFIG, () => true);

    expect(result.flatMap((group) => group.items.map((item) => item.href))).toEqual([
      ApplicationRoute.Prompts,
      ApplicationRoute.Files,
      ApplicationRoute.Projects,
    ]);
  });

  test('drops a group left with no items', () => {
    expect(filterMenuForUnitMode(CONFIG, () => false)).toEqual([]);
  });

  test('hides Folders when only org units are readable', () => {
    expect(filterMenuForUnitMode(FOLDERS_CONFIG, allowed(UnitNamespace.ORG_UNITS))).toEqual([]);
  });

  test('shows Folders when role assignments are readable', () => {
    const result = filterMenuForUnitMode(FOLDERS_CONFIG, allowed(UnitNamespace.ROLE_ASSIGNMENTS));

    expect(result[0].items.map((item) => item.href)).toEqual([ApplicationRoute.FoldersStorage]);
  });
});
