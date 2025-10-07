import { DuplicateI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';

export const duplicateModalTitleMap: Record<string, DuplicateI18nKey> = {
  [ApplicationRoute.Models]: DuplicateI18nKey.ModelHeader,
  [ApplicationRoute.Applications]: DuplicateI18nKey.ApplicationHeader,
  [ApplicationRoute.Interceptors]: DuplicateI18nKey.InterceptorHeader,
  [ApplicationRoute.Keys]: DuplicateI18nKey.KeyHeader,
  [ApplicationRoute.Routes]: DuplicateI18nKey.RouteHeader,
  [ApplicationRoute.Roles]: DuplicateI18nKey.RoleHeader,
  [ApplicationRoute.Prompts]: DuplicateI18nKey.PromptHeader,
  [ApplicationRoute.AssetsApplications]: DuplicateI18nKey.ApplicationHeader,
  [ApplicationRoute.AssetsToolsets]: DuplicateI18nKey.Toolsets,
  [ApplicationRoute.Adapters]: DuplicateI18nKey.AdapterHeader,
  [ApplicationRoute.InterceptorTemplates]: DuplicateI18nKey.InterceptorTemplate,
  [ApplicationRoute.Toolsets]: DuplicateI18nKey.Toolsets,
};

export const duplicateModalDescriptionMap: Record<string, DuplicateI18nKey> = {
  [ApplicationRoute.Models]: DuplicateI18nKey.ModelDescription,
};
