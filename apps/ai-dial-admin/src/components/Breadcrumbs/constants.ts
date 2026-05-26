import { ApplicationRoute } from '@/src/types/routes';
import { MenuI18nKey } from '@/src/constants/i18n';
import { BreadcrumbConfig } from '@/src/components/Breadcrumbs/models';

const auditSubIdBreadcrumb = (name: string, i18nKey: MenuI18nKey): BreadcrumbConfig => ({
  segments: [{ name, i18nKey }, { name: 'Id' }, { name: 'Audit Id', href: false }],
});

export const breadcrumbConfig: Partial<Record<ApplicationRoute, BreadcrumbConfig | null>> = {
  [ApplicationRoute.Home]: {
    segments: [{ name: 'Home', i18nKey: MenuI18nKey.Home }],
  },
  [ApplicationRoute.Models]: auditSubIdBreadcrumb('Models', MenuI18nKey.Models),
  [ApplicationRoute.Applications]: auditSubIdBreadcrumb('Application', MenuI18nKey.Applications),
  [ApplicationRoute.Adapters]: auditSubIdBreadcrumb('Adapters', MenuI18nKey.Adapters),
  [ApplicationRoute.Interceptors]: auditSubIdBreadcrumb('Interceptors', MenuI18nKey.Interceptors),
  [ApplicationRoute.Roles]: auditSubIdBreadcrumb('Roles', MenuI18nKey.Roles),
  [ApplicationRoute.Keys]: auditSubIdBreadcrumb('Keys', MenuI18nKey.Keys),
  [ApplicationRoute.Prompts]: {
    segments: [
      { name: 'Prompts', i18nKey: MenuI18nKey.Prompts, shouldEnrichWithFolderBreadcrumbs: true },
      {
        name: 'Id',
        href: false,
      },
    ],
  },
  [ApplicationRoute.Files]: {
    segments: [
      { name: 'Files', i18nKey: MenuI18nKey.Files, shouldEnrichWithFolderBreadcrumbs: true },
      {
        name: 'Id',
        href: false,
      },
    ],
  },
  [ApplicationRoute.AssetsApplications]: {
    segments: [
      { name: 'AssetsApplications', i18nKey: MenuI18nKey.Applications, shouldEnrichWithFolderBreadcrumbs: true },
      {
        name: 'Id',
        href: false,
      },
    ],
  },
  [ApplicationRoute.AssetsToolsets]: {
    segments: [
      { name: 'AssetsToolsets', i18nKey: MenuI18nKey.Toolsets, shouldEnrichWithFolderBreadcrumbs: true },
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
  [ApplicationRoute.ConversationPublications]: {
    segments: [
      { name: 'ConversationPublications', i18nKey: MenuI18nKey.ConversationPublications },
      {
        name: 'Id',
        href: false,
      },
    ],
  },
  [ApplicationRoute.Routes]: auditSubIdBreadcrumb('Routes', MenuI18nKey.Routes),
  [ApplicationRoute.Toolsets]: auditSubIdBreadcrumb('Toolsets', MenuI18nKey.Toolsets),
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
  [ApplicationRoute.ApplicationRunners]: auditSubIdBreadcrumb('ApplicationRunners', MenuI18nKey.ApplicationRunners),
  [ApplicationRoute.InterceptorTemplates]: auditSubIdBreadcrumb(
    'InterceptorTemplates',
    MenuI18nKey.InterceptorTemplates,
  ),
  [ApplicationRoute.InterceptorContainers]: auditSubIdBreadcrumb(
    'InterceptorContainers',
    MenuI18nKey.InterceptorContainers,
  ),
  [ApplicationRoute.ModelServings]: auditSubIdBreadcrumb('ModelServings', MenuI18nKey.ModelServings),
  [ApplicationRoute.McpContainers]: auditSubIdBreadcrumb('McpContainers', MenuI18nKey.McpContainers),
  [ApplicationRoute.AdapterContainers]: auditSubIdBreadcrumb('AdapterContainers', MenuI18nKey.AdapterContainers),
  [ApplicationRoute.ApplicationContainers]: auditSubIdBreadcrumb(
    'ApplicationContainers',
    MenuI18nKey.ApplicationContainers,
  ),
  [ApplicationRoute.Images]: auditSubIdBreadcrumb('Images', MenuI18nKey.Images),
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
