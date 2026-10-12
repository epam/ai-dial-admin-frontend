# Menu Documentation

This documentation describes the structure and contents of the menu items array used in the application. Each entry corresponds to a menu section with various properties, including its title, description, icon, and links to different routes.

Sections are listed in menu order. `DISABLE_MENU_ITEMS` matches the last segment of an item's key (`Menu.Models` → `models`), so a token hides every item with that key, in whichever section it sits. The `catalog` token is the exception that hides all Core-direct items — the ones keyed `Platform*` — wherever they are grouped.

---

## Menu Sections

### 1. **Entities**

- **Description**: A section that manages entities like models, applications, and routes.
- **Items**:
  - **Models**
    - **Key**: `Models`
    - **Description**: Navigate to the models page, where you can view and manage the available models.
  - **Applications**
    - **Key**: `Applications`
    - **Description**: Navigate to the applications page to manage and view all applications.
  - **Toolsets**
    - **Key**: `Toolsets`
    - **Description**: Navigate to the toolsets page to manage reusable components used in application logic.
  - **Interceptors**
    - **Key**: `Interceptors`
    - **Description**: View and configure interceptors that modify application behavior.
  - **Routes**
    - **Key**: `Routes`
    - **Description**: Navigate to the routes page to manage the routes in the system.

### 2. **AI Gateway**

- **Description**: A section for the entities DIAL Core serves, read and written directly against Core rather than through the admin backend. The items keyed `Platform*` are hidden by the `catalog` token of `DISABLE_MENU_ITEMS`.
- **Items**:
  - **Models**
    - **Key**: `PlatformModels`
    - **Description**: Navigate to the models page to manage the models DIAL Core serves, including their catalog metadata.
  - **Toolsets**
    - **Key**: `Toolsets`
    - **Description**: Navigate to the assets toolsets page to manage toolset assets.
  - **Translators**
    - **Key**: `PlatformTranslators`
    - **Description**: Navigate to the translators page to manage the interface translators DIAL Core applies between LLM API dialects.
  - **Routes**
    - **Key**: `PlatformRoutes`
    - **Description**: Navigate to the routes page to manage Core's own routing rules.
  - **Applications**
    - **Key**: `Applications`
    - **Description**: Navigate to the assets applications page for uploading and managing system applications.
  - **App Runners**
    - **Key**: `PlatformAppRunners`
    - **Description**: Navigate to the app runners page to manage the application type schemas applications are built on.
  - **Catalog Schemas**
    - **Key**: `PlatformCatalogSchemas`
    - **Description**: Navigate to the catalog schemas page to define the display metadata a model, agent, toolset, or interceptor can carry.

### 3. **Artifacts**

- **Description**: A section for managing reusable resources like skills, files, conversations, and prompts.
- **Items**:
  - **Skills**
    - **Key**: `Skills`
    - **Description**: Navigate to the skills page to manage reusable skills.
  - **Files**
    - **Key**: `Files`
    - **Description**: Navigate to the files page for uploading and managing system files.
  - **Conversations**
    - **Key**: `Conversations`
    - **Description**: Navigate to the conversations page to manage stored conversations.
  - **Prompts**
    - **Key**: `Prompts`
    - **Description**: Navigate to the prompts page to manage and create prompts used in various workflows.

### 4. **Builders**

- **Description**: A section that provides access to tools for building applications.
- **Items**:
  - **Application Runners**
    - **Key**: `ApplicationRunners`
    - **Description**: Navigate to the page for managing and running applications.
  - **Interceptor Templates**
    - **Key**: `InterceptorTemplates`
    - **Description**: Create and manage templates for interceptors that can be reused across applications.
  - **Adapters**
    - **Key**: `Adapters`
    - **Description**: Navigate to the adapters page to configure integrations and connectors.

### 5. **Access Management**

- **Description**: A section for managing roles and keys.
- **Items**:
  - **Roles**
    - **Key**: `Roles`
    - **Description**: Navigate to the roles management page to assign and manage user roles.
  - **Keys**
    - **Key**: `Keys`
    - **Description**: Navigate to the keys management page for creating and managing API keys and secrets.

### 6. **Deployments**

- **Description**: A section for managing deployments and containers (MCP, interceptors, adapters).
- **Items**:
  - **Model Servings**
    - **Key**: `ModelServings`
    - **Description**: Navigate to the model servings page to manage deployed model instances.
  - **MCP Containers**
    - **Key**: `McpContainers`
    - **Description**: Navigate to the MCP containers page to manage Model Context Protocol containers.
  - **Interceptor Containers**
    - **Key**: `InterceptorContainers`
    - **Description**: Navigate to the interceptor containers page to manage deployed interceptor containers.
  - **Adapter Containers**
    - **Key**: `AdapterContainers`
    - **Description**: Navigate to the adapter containers page to manage deployed adapter containers.
  - **Application Containers**
    - **Key**: `ApplicationContainers`
    - **Description**: Navigate to the application containers page to manage deployed application containers.
  - **Images**
    - **Key**: `Images`
    - **Description**: Navigate to the images page to manage container images.

### 7. **Evaluation**

- **Description**: A section for managing test suites, evaluation runs, and datasets.
- **Items**:
  - **Test Suites**
    - **Key**: `TestSuites`
    - **Description**: Navigate to the test suites page to create and manage test suites for evaluation.
  - **Runs**
    - **Key**: `Runs`
    - **Description**: Navigate to the runs page to view and manage evaluation run history and results.
  - **Datasets**
    - **Key**: `Datasets`
    - **Description**: Navigate to the datasets page to create and manage datasets used by test suites.

### 8. **Analytics** [Preview]

Documented per capability under `openspec/specs/analytics/`. Items, in order: Dashboards, Queries, Sessions, Tables, Pipelines.

### 9. **Governance**

- **Description**: A section for access, folder permissions, interceptors, and the approval of published artifacts. Roles, Keys, and Interceptors are Core-direct items (`Platform*`) hidden by the `catalog` token of `DISABLE_MENU_ITEMS`.
- **Items**:
  - **Roles**
    - **Key**: `PlatformRoles`
    - **Description**: Navigate to the roles page to manage roles and their limits.
  - **Keys**
    - **Key**: `PlatformKeys`
    - **Description**: Navigate to the keys page to manage the project keys Core issues.
  - **Folder Permissions**
    - **Key**: `FoldersStorage`
    - **Description**: Manage folder storage and organization for different assets and files.
  - **Interceptors**
    - **Key**: `PlatformInterceptors`
    - **Description**: Navigate to the interceptors page to manage interceptors and their catalog metadata.
  - **Application Publications**
    - **Key**: `ApplicationPublications`
    - **Description**: Navigate to the application publications page to review and approve application submissions.
  - **Toolset Publications**
    - **Key**: `ToolsetPublications`
    - **Description**: Navigate to the toolset publications page to review and approve toolset submissions.
  - **Prompt Publications**
    - **Key**: `PromptPublications`
    - **Description**: Navigate to the prompt publications page to review and approve prompt submissions.
  - **Conversation Publications**
    - **Key**: `ConversationPublications`
    - **Description**: Navigate to the conversation publications page to review and approve conversation submissions.
  - **File Publications**
    - **Key**: `FilePublications`
    - **Description**: Navigate to the file publications page to review and approve files before they are shared.
  - **Skill Publications**
    - **Key**: `SkillPublications`
    - **Description**: Navigate to the skill publications page to review and approve skill submissions.

### 10. **Audit**

- **Description**: A section for accessing telemetry data, logs, and audit information.
- **Items**:
  - **Dashboards**
    - **Key**: `Dashboard`
    - **Description**: Navigate to `/dashboards`, which serves the telemetry dashboard with system metrics, performance, and usage statistics. Present here only while the analytics Dashboards page is off; while `ANALYTICS_ENABLED` and `ANALYTICS_USAGE_ENABLED` are both on, the same item is the first entry of the Analytics section and `/dashboards` serves the analytics page instead (see `openspec/specs/analytics/dashboards/`). Hidden by the `dashboard` token of `DISABLE_MENU_ITEMS` in either section.
  - **Activity Audit**
    - **Key**: `ActivityAudit`
    - **Description**: Navigate to the activity audit page to track system activities and user actions.
  - **Usage Log**
    - **Key**: `UsageLog`
    - **Description**: Navigate to the usage log page to view detailed usage logs and analytics.
