import { ApplicationsI18nKey, ImportI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';

export const getIgnorePathTitles = (view: ApplicationRoute, t: (str: string) => string): string => {
  if (view === ApplicationRoute.Prompts) {
    return t(ImportI18nKey.PromptPaths);
  }
  if (view === ApplicationRoute.Files) {
    return t(ImportI18nKey.FilePaths);
  }
  if (view === ApplicationRoute.AssetsToolsets) {
    return t(ToolsetI18nKey.ToolsetPath);
  }

  if (view === ApplicationRoute.AssetsApplications) {
    return t(ApplicationsI18nKey.ApplicationPaths);
  }
  return '';
};
