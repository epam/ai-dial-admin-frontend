import { MenuI18nKey } from '@/src/constants/i18n';
import { DialApplication } from '@/src/models/dial/application';
import { DialModel } from '@/src/models/dial/model';
import { EntitiesGridData } from '@/src/models/entities-grid-data';

export const getDependenciesData = (
  dependencies: string[],
  allModels: DialModel[],
  allApplications: DialApplication[],
) => {
  const dependencySet = new Set(dependencies);

  const data: EntitiesGridData[] = [];
  const filteredModels: DialModel[] = [];
  const filteredApplications: DialApplication[] = [];

  for (const model of allModels) {
    if (dependencySet.has(model.name as string)) {
      data.push({ ...model, type: MenuI18nKey.Models });
    } else {
      filteredModels.push(model);
    }
  }

  for (const app of allApplications) {
    if (dependencySet.has(app.name as string)) {
      data.push({ ...app, type: MenuI18nKey.Applications });
    } else {
      filteredApplications.push(app);
    }
  }

  return { data, filteredModels, filteredApplications };
};
