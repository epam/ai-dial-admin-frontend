import { MenuI18nKey } from '@/src/constants/i18n';
import { DialApplication } from '@/src/models/dial/application';
import { DialModel } from '@/src/models/dial/model';
import { describe, expect, test } from 'vitest';
import { getDependenciesData } from '../utils';

describe('getDependenciesData', () => {
  const models: DialModel[] = [
    { name: 'modelA', type: MenuI18nKey.Models },
    { name: 'modelB', type: MenuI18nKey.Models },
    { name: 'modelC', type: MenuI18nKey.Models },
  ];

  const applications: DialApplication[] = [
    { name: 'appA', type: MenuI18nKey.Applications },
    { name: 'appB', type: MenuI18nKey.Applications },
    { name: 'appC', type: MenuI18nKey.Applications },
  ];

  test('should correctly separate dependencies and available entities', () => {
    const dependencies = ['modelB', 'appC'];

    const { data, filteredApplications, filteredModels } = getDependenciesData(dependencies, models, applications);

    expect(data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'modelB', type: MenuI18nKey.Models }),
        expect.objectContaining({ name: 'appC', type: MenuI18nKey.Applications }),
      ]),
    );
    expect(data).toHaveLength(2);

    expect(filteredModels).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'modelA' }),
        expect.objectContaining({ name: 'modelC' }),
      ]),
    );
    expect(filteredModels).not.toEqual(expect.arrayContaining([expect.objectContaining({ name: 'modelB' })]));

    expect(filteredApplications).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'appA' }), expect.objectContaining({ name: 'appB' })]),
    );
    expect(filteredApplications).not.toEqual(expect.arrayContaining([expect.objectContaining({ name: 'appC' })]));
  });

  test('should return empty rowData if no dependencies match', () => {
    const dependencies: string[] = ['nonexistent'];

    const { data, filteredApplications, filteredModels } = getDependenciesData(dependencies, models, applications);

    expect(data).toHaveLength(0);
    expect(filteredApplications).toHaveLength(models.length);
    expect(filteredModels).toHaveLength(applications.length);
  });

  test('should return all entities in rowData if all dependencies match', () => {
    const dependencies = [...models.map((m) => m.name), ...applications.map((a) => a.name)];

    const { data, filteredApplications, filteredModels } = getDependenciesData(dependencies, models, applications);

    expect(data).toHaveLength(models.length + applications.length);
    expect(filteredApplications).toHaveLength(0);
    expect(filteredModels).toHaveLength(0);
  });
});
