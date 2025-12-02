import { ApplicationsI18nKey, FoldersI18nKey, PromptsI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';

export const getModalTitle = (route: ApplicationRoute | undefined, t: (t: string) => string) => {
  switch (route) {
    case ApplicationRoute.Prompts:
      return t(PromptsI18nKey.Export);
    case ApplicationRoute.Files:
      return t(FoldersI18nKey.Export);
    case ApplicationRoute.AssetsApplications:
      return t(ApplicationsI18nKey.Export);
    case ApplicationRoute.AssetsToolsets:
      return t(ToolsetI18nKey.Export);
    default:
      return '';
  }
};
