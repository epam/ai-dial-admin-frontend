import { describe, it, expect } from 'vitest';
import { MenuI18nKey } from '@/src/constants/i18n';
import { DialApplication } from '@/src/models/dial/application';
import { DialModel } from '@/src/models/dial/model';
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

  it('should correctly separate dependencies and available entities', () => {
    const dependencies = ['modelB', 'appC'];

    const { rowData, availableModels, availableApplications } = getDependenciesData(dependencies, models, applications);

    expect(rowData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'modelB', type: MenuI18nKey.Models }),
        expect.objectContaining({ name: 'appC', type: MenuI18nKey.Applications }),
      ]),
    );
    expect(rowData).toHaveLength(2);

    expect(availableModels).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'modelA' }),
        expect.objectContaining({ name: 'modelC' }),
      ]),
    );
    expect(availableModels).not.toEqual(expect.arrayContaining([expect.objectContaining({ name: 'modelB' })]));

    expect(availableApplications).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'appA' }), expect.objectContaining({ name: 'appB' })]),
    );
    expect(availableApplications).not.toEqual(expect.arrayContaining([expect.objectContaining({ name: 'appC' })]));
  });

  it('should return empty rowData if no dependencies match', () => {
    const dependencies: string[] = ['nonexistent'];

    const { rowData, availableModels, availableApplications } = getDependenciesData(dependencies, models, applications);

    expect(rowData).toHaveLength(0);
    expect(availableModels).toHaveLength(models.length);
    expect(availableApplications).toHaveLength(applications.length);
  });

  it('should return all entities in rowData if all dependencies match', () => {
    const dependencies = [...models.map((m) => m.name), ...applications.map((a) => a.name)];

    const { rowData, availableModels, availableApplications } = getDependenciesData(dependencies, models, applications);

    expect(rowData).toHaveLength(models.length + applications.length);
    expect(availableModels).toHaveLength(0);
    expect(availableApplications).toHaveLength(0);
  });
});
