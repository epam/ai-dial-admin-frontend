import { ApplicationRoute } from '@/src/types/routes';

export const HELP_DOCUMENTATION_LINKS: Partial<
  Record<ApplicationRoute, { title?: string; listView: string; selectedView?: string }>
> = {
  [ApplicationRoute.Home]: { listView: '/tutorials/admin/home' },

  [ApplicationRoute.SystemProperties]: { listView: '/tutorials/admin/home#system-properties' },
  [ApplicationRoute.ImportConfig]: { listView: '/tutorials/admin/home#import-config' },
  [ApplicationRoute.ExportConfig]: { listView: '/tutorials/admin/home#export-config' },

  [ApplicationRoute.Models]: {
    listView: '/tutorials/admin/entities-models',
    selectedView: '/tutorials/admin/entities-models#configuration',
    title: 'How to set up models',
  },
  [ApplicationRoute.Applications]: {
    listView: '/tutorials/admin/entities-applications',
    selectedView: '/tutorials/admin/entities-applications#configuration',
    title: 'How to set up applications',
  },
  [ApplicationRoute.Interceptors]: {
    listView: '/tutorials/admin/entities-interceptors',
    selectedView: '/tutorials/admin/entities-interceptors#configuration',
    title: 'How to set up interceptors',
  },
  [ApplicationRoute.Toolsets]: {
    listView: '/tutorials/admin/entities-toolsets',
    selectedView: '/tutorials/admin/entities-toolsets#configuration',
    title: 'How to set up toolsets',
  },
  [ApplicationRoute.Routes]: {
    listView: '/tutorials/admin/entities-routes',
    selectedView: '/tutorials/admin/entities-routes#configuration',
    title: 'How to set up routes',
  },

  [ApplicationRoute.Adapters]: {
    listView: '/tutorials/admin/builders-adapters',
    selectedView: '/tutorials/admin/builders-adapters#configuration',
    title: 'How to set up adapters',
  },
  [ApplicationRoute.ApplicationRunners]: {
    listView: '/tutorials/admin/builders-application-runners',
    selectedView: '/tutorials/admin/builders-application-runners#configuration',
    title: 'How to set up application runners',
  },
  [ApplicationRoute.InterceptorTemplates]: {
    listView: '/tutorials/admin/builders-interceptor-templates',
    selectedView: '/tutorials/admin/builders-interceptor-templates#configuration',
    title: 'How to set up interceptor templates',
  },

  [ApplicationRoute.AssetsApplications]: {
    listView: '/tutorials/admin/assets-applications',
    selectedView: '/tutorials/admin/assets-applications#configuration-screen',
    title: 'How to set up applications',
  },
  [ApplicationRoute.AssetsToolsets]: {
    listView: '/tutorials/admin/assets-toolsets',
    selectedView: '/tutorials/admin/assets-toolsets#configuration-screen',
    title: 'How to set up toolsets',
  },
  [ApplicationRoute.Prompts]: {
    listView: '/tutorials/admin/assets-prompts',
    selectedView: '/tutorials/admin/assets-prompts#configuration',
    title: 'How to set up prompts',
  },
  [ApplicationRoute.Files]: {
    listView: '/tutorials/admin/assets-files',
  },

  [ApplicationRoute.ApplicationPublications]: {
    listView: '/tutorials/admin/approvals-application-publications',
    selectedView: '/tutorials/admin/approvals-application-publications#review-page',
    title: 'How to review application publication requests',
  },

  [ApplicationRoute.ToolsetPublications]: {
    listView: '/tutorials/admin/approvals-toolset-publications',
    selectedView: '/tutorials/admin/approvals-toolset-publications#review-page',
    title: 'How to review toolset publication requests',
  },
  [ApplicationRoute.PromptPublications]: {
    listView: '/tutorials/admin/approvals-prompt-publications',
    selectedView: '/tutorials/admin/approvals-prompt-publications#review-page',
    title: 'How to review prompt publication requests',
  },
  [ApplicationRoute.FilePublications]: {
    listView: '/tutorials/admin/approvals-file-publications',
    selectedView: '/tutorials/admin/approvals-file-publications#review-page',
    title: 'How to review file publication requests',
  },

  [ApplicationRoute.Roles]: {
    listView: '/tutorials/admin/access-management-roles',
    selectedView: '/tutorials/admin/access-management-roles#configuration',
    title: 'How to set up roles',
  },
  [ApplicationRoute.Keys]: {
    listView: '/tutorials/admin/access-management-keys',
    selectedView: '/tutorials/admin/access-management-keys#configuration',
    title: 'How to set up keys',
  },
  [ApplicationRoute.FoldersStorage]: { listView: '/tutorials/admin/access-management-folders-storage' },

  [ApplicationRoute.ActivityAudit]: { listView: '/tutorials/admin/telemetry-activity-audit' },
  [ApplicationRoute.Dashboard]: { listView: '/tutorials/admin/telemetry-dashboard' },
  [ApplicationRoute.UsageLog]: { listView: '/tutorials/admin/telemetry-usage-log' },

  [ApplicationRoute.Images]: {
    listView: '/tutorials/admin/deployments-images',
    selectedView: '/tutorials/admin/deployments-images#configuration',
    title: 'How to set up images',
  },
  [ApplicationRoute.ModelServings]: {
    listView: '/tutorials/admin/deployments-models',
    selectedView: '/tutorials/admin/deployments-models#configuration',
    title: 'How to set up model servings',
  },
  [ApplicationRoute.InterceptorContainers]: {
    listView: '/tutorials/admin/deployments-interceptors',
    selectedView: '/tutorials/admin/deployments-interceptors#configuration',
    title: 'How to set up interceptor containers',
  },
  [ApplicationRoute.McpContainers]: {
    listView: '/tutorials/admin/deployments-mcp',
    selectedView: '/tutorials/admin/deployments-mcp#configuration',
    title: 'How to set up MCP containers',
  },
  // TODO: update adapter container link when the documentation is ready
  // [ApplicationRoute.AdapterContainers]: { list: '/tutorials/admin/deployments-adapter-containers', selectedView: '/tutorials/admin/deployments-adapter-containers#configuration' },

  // TODO: update eval links when the documentation is ready
  // [ApplicationRoute.Playground]: '/playground',
  // [ApplicationRoute.TestSuites]: '/test-suites',
  // [ApplicationRoute.Runs]: '/runs',
  // [ApplicationRoute.Metrics]: '/metrics',
};
