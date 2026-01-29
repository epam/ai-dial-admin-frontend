export enum ApplicationRoute {
  Home = '/home',
  SystemProperties = '/system-properties',
  ImportConfig = '/import-config',
  ExportConfig = '/export-config',
  Forbidden = '/forbidden',

  // Entities
  Models = '/models',
  Applications = '/applications',
  Interceptors = '/interceptors',
  Toolsets = '/toolsets',
  Routes = '/routes',

  // Builders
  Adapters = '/adapters',
  ApplicationRunners = '/application-runners',
  InterceptorTemplates = '/interceptor-templates',

  // Assets
  AssetsApplications = '/assets-applications',
  AssetsToolsets = '/assets-toolsets',
  Prompts = '/prompts',
  Files = '/files',

  // Publications
  FoldersStorage = '/folders-storage',
  ApplicationPublications = '/application-publications',
  ToolsetPublications = '/toolset-publications',
  PromptPublications = '/prompt-publications',
  FilePublications = '/file-publications',

  // Access Management
  Roles = '/roles',
  Keys = '/keys',

  // Activity
  Dashboard = '/dashboard',
  UsageLog = '/usage-log',
  ActivityAudit = '/activity-audit',

  // Deployments
  InterceptorDeployments = '/interceptor-deployments',
  ModelServings = '/model-servings',
  McpDeployments = '/mcp-deployments',
  Images = '/deployment-images',

  // evaluations
  Playground = '/playground',
  TestSuits = '/test-suits',
  Runs = '/runs',
  Metrics = '/metrics',
}
