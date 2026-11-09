import {
  enrichDetailsWithFolderBreadcrumbs,
  getBreadcrumbs,
  getEntityFolderPath,
  getFolderContext,
  shouldEnrichDetailsWithFolderBreadcrumbs,
} from '@/src/components/Breadcrumbs/utils';
import { MenuI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { describe, expect, test, vi } from 'vitest';
import { Breadcrumb } from '../models';

describe('Breadcrumbs :: getBreadcrumbConfig with language in path', () => {
  test('Should correctly return Breadcrumbs config', () => {
    const config = getBreadcrumbs('/en/models', 'en');
    expect(config.length).toEqual(1);
    expect(config[0].href).toEqual('/en/models');
    expect(config[0].key).toEqual(MenuI18nKey.Models);
    expect(config[0].name).toEqual('models');
  });

  test('Should correctly return Breadcrumbs config without language in path', () => {
    const config = getBreadcrumbs('/models', 'en');
    expect(config.length).toEqual(1);
    expect(config[0].href).toEqual('/models');
    expect(config[0].key).toEqual(MenuI18nKey.Models);
    expect(config[0].name).toEqual('models');
  });

  test('Should correctly return correct config with unknown route', () => {
    const config = getBreadcrumbs('/unknown', 'en');
    expect(config.length).toEqual(0);
  });

  test('An App Runner detail route keeps its own list segment', () => {
    const config = getBreadcrumbs('/application-runners/runner-1', 'en');
    expect(config[0].href).toEqual('/application-runners');
  });

  test('A custom dashboard route links back to Dashboards and names the dashboard without a link', () => {
    const config = getBreadcrumbs('/en/dashboards/d1', 'en');
    expect(config).toEqual([
      { key: MenuI18nKey.Dashboard, name: 'dashboards', href: '/en/dashboards' },
      { key: undefined, name: 'd1', href: '' },
    ]);
  });

  test('Should return empty array for home page', () => {
    const config = getBreadcrumbs('/home', 'en');
    expect(config.length).toEqual(0);
  });

  test('Should correctly return config with no href items', () => {
    const config = getBreadcrumbs('/en/applications/applicationId/auditActionId', 'en');
    expect(config.length).toEqual(3);
    expect(config[1].href).toEqual('/en/applications/applicationId');
    expect(config[1].key).toBeFalsy();
    expect(config[1].name).toEqual('applicationId');
    expect(config[2].href).toBeFalsy();
    expect(config[2].key).toBeFalsy();
    expect(config[2].name).toEqual('auditActionId');
  });

  test('Should decode URL-encoded path segments in breadcrumb names', () => {
    const config = getBreadcrumbs('/en/models/foo%40bar', 'en');
    expect(config.length).toEqual(2);
    expect(config[1].name).toEqual('foo@bar');
  });

  test('Should correctly return Breadcrumbs config for platform models without folder enrichment', () => {
    const config = getBreadcrumbs('/en/platform-models/modelId', 'en');
    expect(config.length).toEqual(2);
    expect(config[0].href).toEqual('/en/platform-models');
    expect(config[0].key).toEqual(MenuI18nKey.Models);
    expect(config[1].href).toBeFalsy();
    expect(config[1].key).toBeFalsy();
    expect(config[1].name).toEqual('modelId');
  });

  test('Should not enrich platform models breadcrumbs with folder context', () => {
    expect(getFolderContext('/en/platform-models/modelId', 'en')).toBeNull();
  });

  test("Should keep the list breadcrumb pointed at the entity type's own route", () => {
    const config = getBreadcrumbs('/en/models/modelId', 'en');
    expect(config[0].href).toEqual('/en/models');
  });

  test('Should translate runs compare segment via breadcrumb config', () => {
    const config = getBreadcrumbs('/en/runs/compare', 'en');
    expect(config.length).toEqual(2);
    expect(config[0].href).toEqual('/en/runs');
    expect(config[0].key).toEqual(MenuI18nKey.Runs);
    expect(config[1].href).toBeFalsy();
    expect(config[1].key).toEqual(RunsI18nKey.RunComparison);
    expect(config[1].name).toEqual('compare');
  });
});

describe('Breadcrumbs :: getEntityFolderPath', () => {
  test('Should return the folder part of an entity path', () => {
    expect(getEntityFolderPath('public/team/sub/MyApp__1.0')).toBe('public/team/sub/');
  });

  test('Should return undefined for a path without a folder part', () => {
    expect(getEntityFolderPath('MyApp')).toBeUndefined();
  });

  test('Should return undefined when there is no path', () => {
    expect(getEntityFolderPath(null)).toBeUndefined();
    expect(getEntityFolderPath(undefined)).toBeUndefined();
    expect(getEntityFolderPath('')).toBeUndefined();
  });
});

describe('Breadcrumbs :: enrichDetailsWithFolderBreadcrumbs', () => {
  const section: Breadcrumb = {
    key: MenuI18nKey.Applications,
    name: 'assets-applications',
    href: '/assets-applications',
  };
  const entity: Breadcrumb = { name: 'MyApp', href: '' };

  test('Should put the folders between the section and the entity', () => {
    const result = enrichDetailsWithFolderBreadcrumbs([section, entity], 'public/team/');

    expect(result.map((crumb) => crumb.name)).toEqual(['assets-applications', 'public', 'team', 'MyApp']);
    expect(result.map((crumb) => crumb.href)).toEqual(['/assets-applications', 'public/', 'public/team/', '']);
  });

  test('Should report the folder path of the crumb that is clicked', () => {
    const onFolderClick = vi.fn();

    const result = enrichDetailsWithFolderBreadcrumbs([section, entity], 'public/team/', onFolderClick);
    result[2].callback?.(result[2].href);

    expect(onFolderClick).toHaveBeenCalledWith('public/team/');
  });

  test('Should keep every folder of a deep folder trail', () => {
    const result = enrichDetailsWithFolderBreadcrumbs([section, entity], 'public/a/b/c/d/');

    expect(result.map((crumb) => crumb.name)).toEqual(['assets-applications', 'public', 'a', 'b', 'c', 'd', 'MyApp']);
  });

  test('Should leave the breadcrumbs as they are without a folder', () => {
    expect(enrichDetailsWithFolderBreadcrumbs([section, entity], undefined)).toEqual([section, entity]);
  });

  test('Should leave a single breadcrumb as it is', () => {
    expect(enrichDetailsWithFolderBreadcrumbs([section], 'public/')).toEqual([section]);
  });
});

describe('Breadcrumbs :: shouldEnrichDetailsWithFolderBreadcrumbs', () => {
  test('Should be true on the details page of a folder-based view', () => {
    expect(shouldEnrichDetailsWithFolderBreadcrumbs('/assets-applications/MyApp', 'en')).toBe(true);
    expect(shouldEnrichDetailsWithFolderBreadcrumbs('/en/prompts/MyPrompt', 'en')).toBe(true);
  });

  test('Should be false on the list page of that view', () => {
    expect(shouldEnrichDetailsWithFolderBreadcrumbs('/assets-applications', 'en')).toBe(false);
  });

  test('Should be false for a view that is not folder-based', () => {
    expect(shouldEnrichDetailsWithFolderBreadcrumbs('/models/1', 'en')).toBe(false);
  });
});
