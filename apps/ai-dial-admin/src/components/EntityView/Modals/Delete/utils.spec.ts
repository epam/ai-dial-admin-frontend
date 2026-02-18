import { DeleteI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test, vi } from 'vitest';
import {
  getBulkNotificationTitle,
  getConfirmation,
  getNotificationDescription,
  getNotificationTitle,
  getRelatedArtifacts,
  getRelatedText,
  getTitle,
  getWarningText,
} from './utils';

vi.mock('@/src/app/[lang]/interceptors/actions', () => ({
  getInterceptorsList: vi
    .fn()
    .mockResolvedValue({ response: [{ name: 'i1' }, { name: 'i2' }, { name: 'i3' }, { name: 'i4' }, { name: 'i5' }] }),
}));

vi.mock('@/src/app/[lang]/models/actions', () => ({
  getModelsListAction: vi
    .fn()
    .mockResolvedValue({ response: [{ name: 'm1' }, { name: 'm2' }, { name: 'm3' }, { name: 'm4' }, { name: 'm5' }] }),
}));

vi.mock('@/src/app/[lang]/applications/actions', () => ({
  getApplications: vi
    .fn()
    .mockResolvedValue({ response: [{ name: 'a1' }, { name: 'a2' }, { name: 'a3' }, { name: 'a4' }, { name: 'a5' }] }),
}));

describe('EntityView :: Delete :: utils', () => {
  const t = (str: string) => str;
  const tWithProps = (str: string, props?: Record<string, string>) => str + ' with props';
  const entity = { name: 'Test Entity', id: '1' };

  test('getTitle returns a string', () => {
    expect(getTitle(ApplicationRoute.Applications, tWithProps)).toBe(`${DeleteI18nKey.Title} with props`);
  });

  test('getBulkNotificationTitle returns a string', () => {
    expect(getBulkNotificationTitle(ApplicationRoute.AssetsApplications, tWithProps)).toBe(
      `${DeleteI18nKey.NotificationTitle} with props`,
    );
  });

  test('getConfirmation returns a string', () => {
    expect(getConfirmation(ApplicationRoute.Routes, tWithProps)).toBe(`${DeleteI18nKey.Confirming} with props`);
  });

  test('getNotificationTitle returns a string', () => {
    expect(getNotificationTitle(ApplicationRoute.Interceptors, tWithProps)).toBe(
      `${DeleteI18nKey.NotificationTitle} with props`,
    );
  });

  test('getNotificationDescription returns a string', () => {
    expect(getNotificationDescription(ApplicationRoute.Interceptors, 'aa', tWithProps)).toBe(
      `${DeleteI18nKey.NotificationDescription} with props`,
    );

    expect(getNotificationDescription(ApplicationRoute.AssetsApplications, 'aa', tWithProps)).toBe(
      `${DeleteI18nKey.NotificationDescriptionWithoutRollback} with props`,
    );

    expect(getNotificationDescription(ApplicationRoute.TestSuites, 'aa', tWithProps)).toBe(
      `${DeleteI18nKey.NotificationDescriptionWithoutRollback} with props`,
    );
  });

  test('getWarningText returns a string', () => {
    expect(getWarningText(ApplicationRoute.ApplicationRunners, t)).toBe(DeleteI18nKey.ApplicationRunnerWarning);
    expect(getWarningText(ApplicationRoute.InterceptorTemplates, t)).toBe(DeleteI18nKey.InterceptorTemplateWarning);
    expect(getWarningText(ApplicationRoute.Adapters, t)).toBe(DeleteI18nKey.AdapterWarning);
    expect(getWarningText(ApplicationRoute.Images, t)).toBe(DeleteI18nKey.ImageWarning);
    expect(getWarningText(ApplicationRoute.Models, t)).toBe('');
  });

  test('getRelatedText returns a string', () => {
    expect(getRelatedText(ApplicationRoute.ApplicationRunners, t)).toBe(DeleteI18nKey.RelatedApplications);
    expect(getRelatedText(ApplicationRoute.InterceptorTemplates, t)).toBe(DeleteI18nKey.RelatedInterceptors);
    expect(getRelatedText(ApplicationRoute.Adapters, t)).toBe(DeleteI18nKey.RelatedModels);
    expect(getRelatedText(ApplicationRoute.Images, t)).toBe(DeleteI18nKey.RelatedContainers);
    expect(getRelatedText(ApplicationRoute.Models, t)).toBe('');
  });

  test('getRelatedArtifacts returns an array', async () => {
    expect(await getRelatedArtifacts(ApplicationRoute.Models, entity)).toEqual([]);
    expect(
      await getRelatedArtifacts(ApplicationRoute.ApplicationRunners, { ...entity, applications: ['a2', 'a3'] }),
    ).toEqual([{ name: 'a2' }, { name: 'a3' }]);
    expect(
      await getRelatedArtifacts(ApplicationRoute.InterceptorTemplates, { ...entity, interceptors: ['i2', 'i5'] }),
    ).toEqual([{ name: 'i2' }, { name: 'i5' }]);
    expect(await getRelatedArtifacts(ApplicationRoute.Adapters, { ...entity, models: ['m1', 'm3'] })).toEqual([
      { name: 'm1' },
      { name: 'm3' },
    ]);
  });
});
