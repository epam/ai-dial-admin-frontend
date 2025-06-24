import { EntityType } from '@/src/types/entity-type';
import { MenuI18nKey } from '@/src/constants/i18n';

export const getEntitiesList = (t: (v: string) => string) => {
  return [
    { id: EntityType.MODEL, name: t(MenuI18nKey.Models) },
    { id: EntityType.APPLICATION, name: t(MenuI18nKey.Applications) },
    { id: EntityType.ROUTE, name: t(MenuI18nKey.Routes) },
    { id: EntityType.ROLE, name: t(MenuI18nKey.Roles) },
    { id: EntityType.KEY, name: t(MenuI18nKey.Keys) },
    { id: EntityType.APPLICATION_TYPE_SCHEMA, name: t(MenuI18nKey.ApplicationRunners) },
    { id: EntityType.INTERCEPTOR, name: t(MenuI18nKey.Interceptors) },
    { id: EntityType.PROMPT, name: t(MenuI18nKey.Prompts) },
    { id: EntityType.FILE, name: t(MenuI18nKey.Files) },
  ];
};
