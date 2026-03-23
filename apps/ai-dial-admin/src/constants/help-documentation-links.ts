import { ApplicationRoute } from '@/src/types/routes';

export const HELP_DOCUMENTATION_LINKS: Partial<
  Record<ApplicationRoute, { title?: string; listView: string; selectedView?: string }>
> = {
  [ApplicationRoute.Home]: { listView: 'tutorials/admin/home' },

  [ApplicationRoute.SystemProperties]: { listView: 'tutorials/admin/home#system-properties' },
  [ApplicationRoute.ImportConfig]: { listView: 'tutorials/admin/home#import-config' },
  [ApplicationRoute.ExportConfig]: { listView: 'tutorials/admin/home#export-config' },

  [ApplicationRoute.Models]: {
    listView: 'tutorials/admin/entities-models',
    selectedView: 'tutorials/admin/entities-models#configuration',
    title: 'How to set up Models',
  },
  [ApplicationRoute.Applications]: {
    listView: 'tutorials/admin/entities-applications',
    selectedView: 'tutorials/admin/entities-applications#configuration',
    title: 'How to set up Applications',
  },
  [ApplicationRoute.Interceptors]: {
    listView: 'tutorials/admin/entities-interceptors',
    selectedView: 'tutorials/admin/entities-interceptors#configuration',
    title: 'How to set up Interceptors',
  },
  [ApplicationRoute.Toolsets]: {
    listView: 'tutorials/admin/entities-toolsets',
    selectedView: 'tutorials/admin/entities-toolsets#configuration',
    title: 'How to set up Toolsets',
  },
  [ApplicationRoute.Routes]: {
    listView: 'tutorials/admin/entities-routes',
    selectedView: 'tutorials/admin/entities-routes#configuration',
    title: 'How to set up Routes',
  },

  [ApplicationRoute.Adapters]: {
    listView: 'tutorials/admin/builders-adapters',
    selectedView: 'tutorials/admin/builders-adapters#configuration',
    title: 'How to set up Adapters',
  },
  [ApplicationRoute.ApplicationRunners]: {
    listView: 'tutorials/admin/builders-application-runners',
    selectedView: 'tutorials/admin/builders-application-runners#configuration',
    title: 'How to set up Application Runners',
  },
  [ApplicationRoute.InterceptorTemplates]: {
    listView: 'tutorials/admin/builders-interceptor-templates',
    selectedView: 'tutorials/admin/builders-interceptor-templates#configuration',
    title: 'How to set up Interceptor Templates',
  },

  [ApplicationRoute.AssetsApplications]: {
    listView: 'tutorials/admin/assets-applications',
    selectedView: 'tutorials/admin/assets-applications#configuration-screen',
    title: 'How to set up Applications',
  },
  [ApplicationRoute.AssetsToolsets]: {
    listView: 'tutorials/admin/assets-toolsets',
    selectedView: 'tutorials/admin/assets-toolsets#configuration-screen',
    title: 'How to set up Toolsets',
  },
  [ApplicationRoute.Prompts]: {
    listView: 'tutorials/admin/assets-prompts',
    selectedView: 'tutorials/admin/assets-prompts#configuration',
    title: 'How to set up Prompts',
  },
  [ApplicationRoute.Files]: {
    listView: 'tutorials/admin/assets-files',
    title: 'How to manage Files',
  },

  [ApplicationRoute.ApplicationPublications]: {
    listView: 'tutorials/admin/approvals-application-publications',
    selectedView: 'tutorials/admin/approvals-application-publications#review-page',
    title: 'How to review Application Publication requests',
  },

  [ApplicationRoute.ToolsetPublications]: {
    listView: 'tutorials/admin/approvals-toolset-publications',
    selectedView: 'tutorials/admin/approvals-toolset-publications#review-page',
    title: 'How to review Toolset Publication requests',
  },
  [ApplicationRoute.PromptPublications]: {
    listView: 'tutorials/admin/approvals-prompt-publications',
    selectedView: 'tutorials/admin/approvals-prompt-publications#review-page',
    title: 'How to review Prompt Publication requests',
  },
  [ApplicationRoute.FilePublications]: {
    listView: 'tutorials/admin/approvals-file-publications',
    selectedView: 'tutorials/admin/approvals-file-publications#review-page',
    title: 'How to review File Publication requests',
  },

  [ApplicationRoute.Roles]: {
    listView: 'tutorials/admin/access-management-roles',
    selectedView: 'tutorials/admin/access-management-roles#configuration',
    title: 'How to set up Roles',
  },
  [ApplicationRoute.Keys]: {
    listView: 'tutorials/admin/access-management-keys',
    selectedView: 'tutorials/admin/access-management-keys#configuration',
    title: 'How to set up Keys',
  },
  [ApplicationRoute.FoldersStorage]: {
    listView: 'tutorials/admin/access-management-folders-storage',
    title: 'How to use Folders Storage',
  },

  [ApplicationRoute.ActivityAudit]: {
    listView: 'tutorials/admin/telemetry-activity-audit',
    selectedView: 'tutorials/admin/telemetry-activity-audit#activity-details',
    title: 'How to review Activities',
  },
  [ApplicationRoute.Dashboard]: {
    listView: 'tutorials/admin/telemetry-dashboard',
    title: 'How to monitor metrics in the Dashboard',
  },
  [ApplicationRoute.UsageLog]: { listView: 'tutorials/admin/telemetry-usage-log', title: 'How to review Usage Logs' },

  [ApplicationRoute.Images]: {
    listView: 'tutorials/admin/deployments-images',
    selectedView: 'tutorials/admin/deployments-images#configuration',
    title: 'How to set up Images',
  },
  [ApplicationRoute.ModelServings]: {
    listView: 'tutorials/admin/deployments-models',
    selectedView: 'tutorials/admin/deployments-models#configuration',
    title: 'How to set up Model Servings',
  },
  [ApplicationRoute.InterceptorContainers]: {
    listView: 'tutorials/admin/deployments-interceptors',
    selectedView: 'tutorials/admin/deployments-interceptors#configuration',
    title: 'How to set up Interceptor Containers',
  },
  [ApplicationRoute.McpContainers]: {
    listView: 'tutorials/admin/deployments-mcp',
    selectedView: 'tutorials/admin/deployments-mcp#configuration',
    title: 'How to set up MCP Containers',
  },
  [ApplicationRoute.AdapterContainers]: {
    listView: 'tutorials/admin/deployments-adapters',
    selectedView: 'tutorials/admin/deployments-adapters#configuration',
  },

  // TODO: update eval links when the documentation is ready
  // [ApplicationRoute.Playground]: '/playground',
  // [ApplicationRoute.TestSuites]: '/test-suites',
  // [ApplicationRoute.Runs]: '/runs',
  // [ApplicationRoute.Metrics]: '/metrics',
};
