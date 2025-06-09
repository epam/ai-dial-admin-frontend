import { DuplicateI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';

export const duplicateModalTitleMap: Record<string, DuplicateI18nKey> = {
  [ApplicationRoute.Models]: DuplicateI18nKey.ModelHeader,
  [ApplicationRoute.Applications]: DuplicateI18nKey.ApplicationHeader,
  [ApplicationRoute.Interceptors]: DuplicateI18nKey.InterceptorHeader,
  [ApplicationRoute.Keys]: DuplicateI18nKey.KeyHeader,
  [ApplicationRoute.Routes]: DuplicateI18nKey.RouteHeader,
  [ApplicationRoute.Roles]: DuplicateI18nKey.RoleHeader,
  [ApplicationRoute.Addons]: DuplicateI18nKey.AddonsHeader,
  [ApplicationRoute.Assistants]: DuplicateI18nKey.AssistantHeader,
  [ApplicationRoute.Prompts]: DuplicateI18nKey.PromptHeader,
  [ApplicationRoute.Adapters]: DuplicateI18nKey.AdapterHeader,
};

export const duplicateModalDescriptionMap: Record<string, DuplicateI18nKey> = {
  [ApplicationRoute.Models]: DuplicateI18nKey.ModelDescription,
  [ApplicationRoute.Applications]: DuplicateI18nKey.ApplicationDescription,
  [ApplicationRoute.Addons]: DuplicateI18nKey.AddonsDescription,
  [ApplicationRoute.Assistants]: DuplicateI18nKey.AssistantDescription,
};
