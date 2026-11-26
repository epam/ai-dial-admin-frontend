# Menu Documentation

This documentation describes the structure and contents of the menu items array used in the application. Each entry corresponds to a menu section with various properties, including its title, description, icon, and links to different routes.

Sections are listed in menu order. `DISABLE_MENU_ITEMS` matches the last segment of an item's key (`Menu.Models` → `models`), so a token hides every item with that key, in whichever section it sits.

A `[Preview]` or `[Deprecated]` marker after a section title is that group's `badge` (`MenuBadge`): a badge shown on the group header while the sidebar is expanded. Sub-items carry no badge, except the Evaluation and Governance items marked `[Preview]` below.

---

## Menu Sections

### 1. **Entities** [Deprecated]

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

- **Description**: A section for the entities DIAL Core serves, read and written directly against Core rather than through the admin backend. The items keyed `Platform*` are always shown.
- **Items**:
  - **Models**
    - **Key**: `PlatformModels`
    - **Description**: Navigate to the models page to manage the models DIAL Core serves, including their catalog metadata.
  - **Toolsets**
    - **Key**: `Toolsets`
    - **Description**: Navigate to the assets toolsets page to manage toolset assets.
  - **Auto Routers**
    - **Key**: `PlatformRouters`
    - **Description**: Navigate to the auto routers page to manage the auto routers DIAL Core uses to pick the deployment serving a request, in proxy or decision mode.
  - **Translators**
    - **Key**: `PlatformTranslators`
    - **Description**: Navigate to the translators page to manage the interface translators DIAL Core applies between LLM API dialects.
  - **Plugins**
    - **Key**: `PlatformPlugins`
    - **Description**: Navigate to the plugins page to manage the instances of in-process plugin code that DIAL Core runs in place of an HTTP call, each with a type and settings (preview).
  - **Aliases**
    - **Key**: `PlatformAliases`
    - **Description**: Navigate to the aliases page to manage the deployments that forward calls to a model, application or toolset under a name of their own, kept in Core's Platform and Public storage or declared in the config file.
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

### 4. **Builders** [Deprecated]

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

### 5. **Access Management** [Deprecated]

- **Description**: A section for managing roles and keys.
- **Items**:
  - **Roles**
    - **Key**: `Roles`
    - **Description**: Navigate to the roles management page to assign and manage user roles.
  - **Keys**
    - **Key**: `Keys`
    - **Description**: Navigate to the keys management page for creating and managing API keys and secrets.

### 6. **Deployments**

- **Description**: A section for managing deployments and containers (MCP, interceptors, adapters, applications).
- **Items**:
  - **Model Servings**
    - **Key**: `ModelServings`
    - **Description**: Navigate to the model servings page to manage deployed model instances.
  - **Containers**
    - **Key**: `Containers`
    - **Description**: Navigate to the containers page to manage MCP, interceptor, adapter and application containers; the Type column tells them apart and the create dialog asks for the type.
  - **Images**
    - **Key**: `Images`
    - **Description**: Navigate to the images page to manage container images.

### 7. **Evaluation**

- **Description**: A section for managing test suites, evaluation runs, and datasets, and for seeing how much of the platform has been evaluated.
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
  - **System Health** [Preview]
    - **Key**: `SystemHealth`
    - **Description**: Navigate to the system health page (`/system-health`) to see how much of what is deployed has been evaluated. A first row of four key figures shows the evaluatee coverage and the test suites run this month, the test suites added this month and the eval cost this month. Below it, a two-by-two block of coverage cards (models, applications, toolsets and routes) sits beside the Test suite health distribution chart; on narrower screens the chart takes the full width and the cards go three, two, then one to a line. Coverage: an evaluatee is covered when a test suite has run on it in the last 30 days; routes count in the overall card; if the route listing fails only the routes and overall cards show an error. Activity: the test suites run and added this month (the added card's `across N evaluatees` caption counts the distinct models, applications, toolsets and routes the new suites target) and the eval cost this month (the platform-wide cost of running test cases and of the judge calls that score them, with the split between the two), each against the same span of the previous month; a rise in cost is shown in red, since spending less is the better outcome. Below that row, a full-width Evaluation Run Trends table lists the test suites with a recorded completed run, lowest latest pass rate first (the backend fixes the order, so it cannot be re-sorted), 10 per page: the test suite's name and id, the evaluatee's name and type, a bar chart of the pass rate over the suite's last 10 runs, the latest pass rate and its change against the run before. The Test suite health distribution chart shows the last 5 UTC weeks as 100%-stacked bars, each split into the test suites whose pooled pass rate that week was at or above 0.75 (healthy) and below it (fail); the week's counts and shares are in a tooltip on hover, and an info icon beside the title explains the chart.

### 8. **Analytics** [Preview]

Documented per capability under `openspec/specs/analytics/`. Items, in order: Dashboards, Queries, Sessions, Tables, Pipelines.

### 9. **Governance**

- **Description**: A section for access, folder permissions, interceptors, and the approval of published artifacts. Roles, Keys, Interceptors, Policies, and Policy Assignments are Core-direct items (`Platform*`).
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
  - **Policies** [Preview]
    - **Key**: `PlatformPolicies`
    - **Description**: Navigate to the policies page (`/platform-policies`) to manage the spending-limit policies DIAL Core stores: a budget, what it applies to, and which subjects it reaches. A policy is global or belongs to one cost object. Core does not enforce policies yet. Shown only while `POLICIES_ENABLED` is `true`.
  - **Policy Assignments** [Preview]
    - **Key**: `PlatformPolicyAssignments`
    - **Description**: Navigate to the policy assignments page (`/platform-policy-assignments`) to manage which cost object a policy applies to, and for whom. Shown only while `POLICIES_ENABLED` is `true`.
  - **Approvals**
    - **Key**: `Approvals`
    - **Description**: Navigate to the approvals page (`/publications`) to review and approve publication requests. One list shows the requests of every resource type (Application, Toolset, Prompt, Conversation, File, Skill), told apart by the Type column; opening a row shows the type's review page.

### 10. **Audit** [Deprecated]

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
