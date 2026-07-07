export enum ApplicationRoute {
  Home = '/home',
  SystemProperties = '/system-properties',
  ImportConfig = '/import-config',
  ExportConfig = '/export-config',

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
  Conversations = '/conversations',
  Prompts = '/prompts',
  Files = '/files',

  // Publications
  FoldersStorage = '/folders-storage',
  ApplicationPublications = '/application-publications',
  ToolsetPublications = '/toolset-publications',
  PromptPublications = '/prompt-publications',
  FilePublications = '/file-publications',
  ConversationPublications = '/conversation-publications',

  // Access Management
  Roles = '/roles',
  Keys = '/keys',

  // Activity
  Dashboard = '/dashboard',
  UsageLog = '/usage-log',
  ActivityAudit = '/activity-audit',

  // Deployments
  InterceptorContainers = '/interceptor-containers',
  ModelServings = '/model-servings',
  McpContainers = '/mcp-containers',
  AdapterContainers = '/adapter-containers',
  ApplicationContainers = '/application-containers',
  Images = '/deployment-images',

  // evaluations
  TestSuites = '/test-suites',
  TestCases = '/test-cases',
  Datasets = '/datasets',
  Runs = '/runs',
  RunsCompare = '/runs/compare',
  Metrics = '/metrics',

  // Analytics 2.0
  AnalyticsV2QueryBuilder = '/analytics-v2/query-builder',
  AnalyticsV2Tables = '/analytics-v2/tables',
}
