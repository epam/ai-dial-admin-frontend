import { ApplicationRoute } from '@/src/types/routes';
import { MenuI18nKey } from '@/src/constants/i18n';
import { BreadcrumbConfig } from '@/src/components/Breadcrumbs/Breadcrumbs.utils';

export const breadcrumbConfig: Record<ApplicationRoute, BreadcrumbConfig> = {
  [ApplicationRoute.Home]: {
    segments: [{ name: 'Home', i18nKey: MenuI18nKey.Home }],
  },
  [ApplicationRoute.Models]: {
    segments: [
      { name: 'Models', i18nKey: MenuI18nKey.Models },
      {
        name: 'Id',
        href: false,
      },
    ],
  },
  [ApplicationRoute.Applications]: {
    segments: [
      {
        name: 'Application',
        i18nKey: MenuI18nKey.Applications,
      },
      { name: 'Id', href: false },
    ],
  },
  [ApplicationRoute.Assistants]: {
    segments: [
      { name: 'Assistants', i18nKey: MenuI18nKey.Assistants },
      {
        name: 'Id',
        href: false,
      },
    ],
  },
  [ApplicationRoute.Adapters]: {
    segments: [
      { name: 'Adapters', i18nKey: MenuI18nKey.Adapters },
      {
        name: 'Id',
        href: false,
      },
    ],
  },
  [ApplicationRoute.Interceptors]: {
    segments: [
      {
        name: 'Interceptors',
        i18nKey: MenuI18nKey.Interceptors,
      },
      { name: 'Id', href: false },
    ],
  },
  [ApplicationRoute.Addons]: {
    segments: [
      {
        name: 'Addons',
        i18nKey: MenuI18nKey.Addons,
      },
      { name: 'Id', href: false },
    ],
  },
  [ApplicationRoute.Roles]: {
    segments: [
      { name: 'Roles', i18nKey: MenuI18nKey.Roles },
      { name: 'Id', href: false },
    ],
  },
  [ApplicationRoute.Keys]: {
    segments: [
      { name: 'Keys', i18nKey: MenuI18nKey.Keys },
      { name: 'Id', href: false },
    ],
  },
  [ApplicationRoute.Prompts]: {
    segments: [
      { name: 'Prompts', i18nKey: MenuI18nKey.Prompts },
      {
        name: 'Id',
        href: false,
      },
    ],
  },
  [ApplicationRoute.Files]: {
    segments: [
      { name: 'Files', i18nKey: MenuI18nKey.Files },
      {
        name: 'Id',
        href: false,
      },
    ],
  },
  [ApplicationRoute.FoldersStorage]: {
    segments: [
      { name: 'FoldersStorage', i18nKey: MenuI18nKey.FoldersStorage },
      {
        name: 'Id',
        href: false,
      },
    ],
  },
  [ApplicationRoute.PromptPublications]: {
    segments: [
      { name: 'Keys', i18nKey: MenuI18nKey.PromptPublications },
      {
        name: 'Id',
        href: false,
      },
    ],
  },
  [ApplicationRoute.FilePublications]: {
    segments: [
      { name: 'Keys', i18nKey: MenuI18nKey.FilePublications },
      {
        name: 'Id',
        href: false,
      },
    ],
  },
  [ApplicationRoute.Routes]: {
    segments: [
      {
        name: 'Routes',
        i18nKey: MenuI18nKey.Routes,
      },
      { name: 'Id', href: false },
    ],
  },
  [ApplicationRoute.Dashboard]: {
    segments: [{ name: 'Dashboard', i18nKey: MenuI18nKey.Dashboard }],
  },
  [ApplicationRoute.ImportConfig]: {
    segments: [{ name: 'Import Config', i18nKey: MenuI18nKey.ImportConfig }],
  },
  [ApplicationRoute.ExportConfig]: {
    segments: [{ name: 'Export Config', i18nKey: MenuI18nKey.ExportConfig }],
  },
  [ApplicationRoute.UsageLog]: {
    segments: [{ name: 'Usage Log', i18nKey: MenuI18nKey.UsageLog }],
  },
  [ApplicationRoute.ActivityAudit]: {
    segments: [
      { name: 'Activity Audit', i18nKey: MenuI18nKey.ActivityAudit },
      {
        name: 'Id',
        href: false,
      },
    ],
  },
  [ApplicationRoute.ApplicationRunners]: {
    segments: [
      {
        name: 'ApplicationRunners',
        i18nKey: MenuI18nKey.ApplicationRunners,
      },
      { name: 'Id', href: false },
    ],
  },
  [ApplicationRoute.Forbidden]: {
    segments: [{ name: 'Forbidden' }],
  },
};
