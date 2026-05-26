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
  Playground = '/playground',
  TestSuites = '/test-suites',
  TestCases = '/test-cases',
  Runs = '/runs',
  Metrics = '/metrics',
}
