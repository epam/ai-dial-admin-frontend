import { enrichWithFolderBreadcrumbs, getBreadcrumbs } from '@/src/components/Breadcrumbs/utils';
import { MenuI18nKey } from '@/src/constants/i18n';
import { describe, expect, test } from 'vitest';
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
});

describe('Breadcrumbs :: enrichWithFolderBreadcrumbs', () => {
  it('returns original breadcrumbs if path is undefined', () => {
    const breadcrumbs: Breadcrumb[] = [{ name: 'root', href: '/' }];
    const result = enrichWithFolderBreadcrumbs(breadcrumbs, undefined);
    expect(result).toEqual(breadcrumbs);
  });

  it('returns original breadcrumbs if path is empty string', () => {
    const breadcrumbs: Breadcrumb[] = [{ name: 'root', href: '/' }];
    const result = enrichWithFolderBreadcrumbs(breadcrumbs, '');
    expect(result).toEqual(breadcrumbs);
  });

  it('correctly splits path and creates breadcrumbs', () => {
    const breadcrumbs: Breadcrumb[] = [{ name: 'root', href: '/' }];
    const path = '/folder1/folder2/';
    const result = enrichWithFolderBreadcrumbs(breadcrumbs, path);

    expect(result.length).toBe(3);
    expect(result[1].name).toBe('folder1');
    expect(result[1].href).toBe('folder1/');
    expect(result[2].name).toBe('folder2');
    expect(result[2].href).toBe('folder1/folder2/');
  });

  it('trims leading and trailing slashes', () => {
    const breadcrumbs: Breadcrumb[] = [];
    const path = '/a/b/c/';
    const result = enrichWithFolderBreadcrumbs(breadcrumbs, path);

    expect(result.map((b) => b.name)).toEqual(['a', 'b', 'c']);
    expect(result.map((b) => b.href)).toEqual(['a/', 'a/b/', 'a/b/c/']);
  });

  it('calls setFilePath callback when breadcrumb callback is invoked', () => {
    const breadcrumbs: Breadcrumb[] = [];
    const path = 'foo/bar';
    const setFilePath = vi.fn();

    const result = enrichWithFolderBreadcrumbs(breadcrumbs, path, setFilePath);

    // Проверяем, что callback существует и вызывает setFilePath с правильным href
    result[0].callback?.('foo/');
    expect(setFilePath).toHaveBeenCalledWith('foo/');

    result[1].callback?.('foo/bar/');
    expect(setFilePath).toHaveBeenCalledWith('foo/bar/');
  });

  it('works with single folder in path', () => {
    const breadcrumbs: Breadcrumb[] = [];
    const path = 'single';
    const result = enrichWithFolderBreadcrumbs(breadcrumbs, path);

    expect(result.length).toBe(1);
    expect(result[0].name).toBe('single');
    expect(result[0].href).toBe('single/');
  });

  it('appends new breadcrumbs to existing ones', () => {
    const breadcrumbs: Breadcrumb[] = [{ name: 'root', href: '/' }];
    const path = 'a/b';
    const result = enrichWithFolderBreadcrumbs(breadcrumbs, path);

    expect(result[0].name).toBe('root');
    expect(result[1].name).toBe('a');
    expect(result[2].name).toBe('b');
  });
});
