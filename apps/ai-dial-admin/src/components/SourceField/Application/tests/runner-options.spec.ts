import { describe, expect, it } from 'vitest';

import { AppRunnerOrigin } from '@/src/components/SourceField/Application/models';
import {
  buildAppRunnerOptions,
  getRunnerOrigin,
  getRunnerReference,
} from '@/src/components/SourceField/Application/utils';
import { LIST_RUNNER_COLUMNS, PICKER_RUNNER_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { SourceI18nKey } from '@/src/constants/i18n';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { ResourceInfo } from '@/src/server/core/asset-metadata';

const entityRunner = {
  $id: 'http://entity-runner',
  'dial:applicationTypeDisplayName': 'Entity Runner',
  description: 'from the admin BE',
} as DialApplicationScheme;

const assetRunner = {
  name: 'http://asdqwe',
  path: 'http%3A%2F%2Fasdqwe',
  folderId: '',
  author: 'someone',
  createdAt: '1750000000000',
  updatedAt: '1760000000000',
} as ResourceInfo;

describe('buildAppRunnerOptions', () => {
  it('references an entity runner by its bare $id', () => {
    const [option] = buildAppRunnerOptions([entityRunner], []);

    expect(option.origin).toBe(AppRunnerOrigin.Entity);
    expect(option.reference).toBe('http://entity-runner');
  });

  it('references an asset runner by its Core resource name', () => {
    const [option] = buildAppRunnerOptions([], [assetRunner]);

    expect(option.origin).toBe(AppRunnerOrigin.Asset);
    expect(option.reference).toBe('schemas/platform/http%3A%2F%2Fasdqwe');
  });

  it('labels an asset runner by its $id and leaves the content columns unset', () => {
    const [option] = buildAppRunnerOptions([], [assetRunner]);

    expect(option.$id).toBe('http://asdqwe');
    expect(option['dial:applicationTypeDisplayName']).toBeUndefined();
    expect(option.description).toBeUndefined();
    expect(option.topics).toBeUndefined();
  });

  it('carries the metadata author and timestamps so those columns render', () => {
    const [option] = buildAppRunnerOptions([], [assetRunner]);

    expect(option.author).toBe('someone');
    expect(option.createdAt).toBe('1750000000000');
    expect(option.updatedAt).toBe('1760000000000');
  });

  it('keeps the asset runner path so the option can link to its detail route', () => {
    const [option] = buildAppRunnerOptions([], [assetRunner]);

    expect(option.path).toBe('http%3A%2F%2Fasdqwe');
  });

  it('merges both populations, entity rows first', () => {
    const options = buildAppRunnerOptions([entityRunner], [assetRunner]);

    expect(options.map((o) => o.origin)).toEqual([AppRunnerOrigin.Entity, AppRunnerOrigin.Asset]);
  });

  it('tolerates either list being absent', () => {
    expect(buildAppRunnerOptions(null, null)).toEqual([]);
    expect(buildAppRunnerOptions(undefined, undefined)).toEqual([]);
  });
});

describe('getRunnerReference / getRunnerOrigin', () => {
  it('falls back to $id for a plain scheme from an untouched picker consumer', () => {
    expect(getRunnerReference(entityRunner)).toBe('http://entity-runner');
    expect(getRunnerOrigin(entityRunner)).toBe(AppRunnerOrigin.Entity);
  });

  it('reads the reference off a built option rather than its $id', () => {
    const [option] = buildAppRunnerOptions([], [assetRunner]);

    expect(getRunnerReference(option)).toBe('schemas/platform/http%3A%2F%2Fasdqwe');
    expect(getRunnerReference(option)).not.toBe(option.$id);
    expect(getRunnerOrigin(option)).toBe(AppRunnerOrigin.Asset);
  });
});

describe('PICKER_RUNNER_COLUMNS', () => {
  const columns = PICKER_RUNNER_COLUMNS((key: string) => key);

  it('shows only columns both populations can fill without a content read', () => {
    expect(columns.map((c) => c.field)).toEqual(['$id', 'origin', 'author', 'updatedAt']);
  });

  it('drops the content-backed columns the standalone runner list uses', () => {
    const fields = columns.map((c) => c.field);

    expect(fields).not.toContain('dial:applicationTypeDisplayName');
    expect(fields).not.toContain('description');
    expect(fields).not.toContain('topics');
  });

  it('leaves the standalone runner list columns unchanged', () => {
    expect(LIST_RUNNER_COLUMNS.map((c) => c.field)).toContain('dial:applicationTypeDisplayName');
  });

  it('renders the Source cell per origin', () => {
    const format = columns.find((c) => c.field === 'origin')?.valueFormatter as (p: { value: string }) => string;

    expect(format({ value: AppRunnerOrigin.Asset })).toBe(SourceI18nKey.AssetRunner);
    expect(format({ value: AppRunnerOrigin.Entity })).toBe(SourceI18nKey.EntityRunner);
  });
});
