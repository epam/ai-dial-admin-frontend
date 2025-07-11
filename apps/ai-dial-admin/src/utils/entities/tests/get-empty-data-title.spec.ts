import { EntitiesI18nKey, BasicI18nKey } from '@/src/constants/i18n';
import { EntityType } from '@/src/types/entity-type';
import { getEmptyDataTitleI18nKey } from '@/src/utils/entities/get-empty-data-title';
import { describe, expect, test } from 'vitest';

describe('Export Config Utils :: getEmptyDataTitleI18nKey', () => {
  test('Should return key for roles', () => {
    const res = getEmptyDataTitleI18nKey(EntityType.ROLE);

    expect(res).toEqual(EntitiesI18nKey.NoRoles);
  });

  test('Should return key for keys', () => {
    const res = getEmptyDataTitleI18nKey(EntityType.KEY);

    expect(res).toEqual(EntitiesI18nKey.NoKeys);
  });

  test('Should return key for runners', () => {
    const res = getEmptyDataTitleI18nKey(EntityType.APPLICATION_TYPE_SCHEMA);

    expect(res).toEqual(EntitiesI18nKey.NoApplicationRunners);
  });

  test('Should return key for interceptors', () => {
    const res = getEmptyDataTitleI18nKey(EntityType.INTERCEPTOR);

    expect(res).toEqual(EntitiesI18nKey.NoInterceptors);
  });

  test('Should return key for prompts', () => {
    const res = getEmptyDataTitleI18nKey(EntityType.PROMPT);

    expect(res).toEqual(EntitiesI18nKey.NoPrompts);
  });

  test('Should return key for files', () => {
    const res = getEmptyDataTitleI18nKey(EntityType.FILE);

    expect(res).toEqual(EntitiesI18nKey.NoFiles);
  });

  test('Should return key for model', () => {
    const res = getEmptyDataTitleI18nKey(EntityType.MODEL);

    expect(res).toEqual(EntitiesI18nKey.NoModels);
  });

  test('Should return key for applications', () => {
    const res = getEmptyDataTitleI18nKey(EntityType.APPLICATION);

    expect(res).toEqual(EntitiesI18nKey.NoApplications);
  });

  test('Should return key for routes', () => {
    const res = getEmptyDataTitleI18nKey(EntityType.ROUTE);

    expect(res).toEqual(EntitiesI18nKey.NoRoutes);
  });

  test('Should return key for routes', () => {
    const res = getEmptyDataTitleI18nKey(EntityType.ENTITIES);

    expect(res).toEqual(EntitiesI18nKey.NoEntities);
  });

  test('Should return key for routes', () => {
    const res = getEmptyDataTitleI18nKey('unkhonwn' as EntityType);

    expect(res).toEqual(BasicI18nKey.NoData);
  });
});
