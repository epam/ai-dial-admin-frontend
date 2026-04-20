import { ApplicationRoute } from '@/src/types/routes';
import { MenuI18nKey } from '@/src/constants/i18n';
import { BreadcrumbConfig } from '@/src/components/Breadcrumbs/models';

export const breadcrumbConfig: Record<ApplicationRoute, BreadcrumbConfig | null> = {
  [ApplicationRoute.Home]: {
    segments: [{ name: 'Home', i18nKey: MenuI18nKey.Home }],
  },
  [ApplicationRoute.Models]: {
    segments: [
      { name: 'Models', i18nKey: MenuI18nKey.Models },
      {
        name: 'Id',
      },
      {
        name: 'Audit Id',
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
      { name: 'Id' },
      {
        name: 'Audit Id',
        href: false,
      },
    ],
  },
  [ApplicationRoute.Adapters]: {
    segments: [
      { name: 'Adapters', i18nKey: MenuI18nKey.Adapters },
      {
        name: 'Id',
      },
      {
        name: 'Audit Id',
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
      { name: 'Id' },
      {
        name: 'Audit Id',
        href: false,
      },
    ],
  },
  [ApplicationRoute.Roles]: {
    segments: [
      { name: 'Roles', i18nKey: MenuI18nKey.Roles },
      { name: 'Id' },
      {
        name: 'Audit Id',
        href: false,
      },
    ],
  },
  [ApplicationRoute.Keys]: {
    segments: [
      { name: 'Keys', i18nKey: MenuI18nKey.Keys },
      { name: 'Id' },
      {
        name: 'Audit Id',
        href: false,
      },
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
  [ApplicationRoute.AssetsApplications]: {
    segments: [
      { name: 'AssetsApplications', i18nKey: MenuI18nKey.Applications },
      {
        name: 'Id',
        href: false,
      },
    ],
  },
  [ApplicationRoute.AssetsToolsets]: {
    segments: [
      { name: 'AssetsToolsets', i18nKey: MenuI18nKey.Toolsets },
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
      { name: 'PromptPublications', i18nKey: MenuI18nKey.PromptPublications },
      {
        name: 'Id',
        href: false,
      },
    ],
  },
  [ApplicationRoute.ToolsetPublications]: {
    segments: [
      { name: 'ToolsetPublications', i18nKey: MenuI18nKey.ToolsetPublications },
      {
        name: 'Id',
        href: false,
      },
    ],
  },
  [ApplicationRoute.FilePublications]: {
    segments: [
      { name: 'FilePublications', i18nKey: MenuI18nKey.FilePublications },
      {
        name: 'Id',
        href: false,
      },
    ],
  },
  [ApplicationRoute.ApplicationPublications]: {
    segments: [
      { name: 'ApplicationPublications', i18nKey: MenuI18nKey.ApplicationPublications },
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
      { name: 'Id' },
      {
        name: 'Audit Id',
        href: false,
      },
    ],
  },
  [ApplicationRoute.Toolsets]: {
    segments: [
      {
        name: 'Toolsets',
        i18nKey: MenuI18nKey.Toolsets,
      },
      { name: 'Id' },
      {
        name: 'Audit Id',
        href: false,
      },
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
  [ApplicationRoute.SystemProperties]: {
    segments: [{ name: 'System Properties', i18nKey: MenuI18nKey.SystemProperties }],
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
      { name: 'Id' },
      {
        name: 'Audit Id',
        href: false,
      },
    ],
  },
  [ApplicationRoute.InterceptorTemplates]: {
    segments: [
      {
        name: 'InterceptorTemplates',
        i18nKey: MenuI18nKey.InterceptorTemplates,
      },
      { name: 'Id' },
      {
        name: 'Audit Id',
        href: false,
      },
    ],
  },
  [ApplicationRoute.InterceptorContainers]: {
    segments: [
      {
        name: 'InterceptorContainers',
        i18nKey: MenuI18nKey.InterceptorContainers,
      },
      { name: 'Id', href: false },
    ],
  },
  [ApplicationRoute.ModelServings]: {
    segments: [
      {
        name: 'ModelServings',
        i18nKey: MenuI18nKey.ModelServings,
      },
      { name: 'Id', href: false },
    ],
  },
  [ApplicationRoute.McpContainers]: {
    segments: [
      {
        name: 'McpContainers',
        i18nKey: MenuI18nKey.McpContainers,
      },
      { name: 'Id', href: false },
    ],
  },
  [ApplicationRoute.AdapterContainers]: {
    segments: [
      {
        name: 'AdapterContainers',
        i18nKey: MenuI18nKey.AdapterContainers,
      },
      { name: 'Id', href: false },
    ],
  },
  [ApplicationRoute.ApplicationContainers]: {
    segments: [
      {
        name: 'ApplicationContainers',
        i18nKey: MenuI18nKey.ApplicationContainers,
      },
      { name: 'Id', href: false },
    ],
  },
  [ApplicationRoute.Images]: {
    segments: [
      {
        name: 'Images',
        i18nKey: MenuI18nKey.Images,
      },
      { name: 'Id', href: false },
    ],
  },
  [ApplicationRoute.Playground]: {
    segments: [
      {
        name: 'Playground',
        i18nKey: MenuI18nKey.Playground,
      },
    ],
  },
  [ApplicationRoute.TestSuites]: {
    segments: [
      {
        name: 'TestSuites',
        i18nKey: MenuI18nKey.TestSuites,
      },
      { name: 'Id', href: false },
    ],
  },
  [ApplicationRoute.Runs]: {
    segments: [
      {
        name: 'Runs',
        i18nKey: MenuI18nKey.Runs,
      },
      { name: 'Id', href: false },
    ],
  },
  [ApplicationRoute.Metrics]: {
    segments: [
      {
        name: 'Metrics',
        i18nKey: MenuI18nKey.Metrics,
      },
      { name: 'Id', href: false },
    ],
  },
};
