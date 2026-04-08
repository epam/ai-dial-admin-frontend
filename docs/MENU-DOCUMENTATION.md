# Menu Documentation

This documentation describes the structure and contents of the menu items array used in the application. Each entry corresponds to a menu section with various properties, including its title, description, icon, and links to different routes.

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

### 2. **Builders**

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

### 3. **Assets**

- **Description**: A section for managing assets like applications, toolsets, prompts, and files.
- **Items**:
  - **Applications**
    - **Key**: `Applications`
    - **Description**: Navigate to the assets applications page for uploading and managing system applications.
  - **Toolsets**
    - **Key**: `Toolsets`
    - **Description**: Navigate to the assets toolsets page to manage toolset assets.
  - **Prompts**
    - **Key**: `Prompts`
    - **Description**: Navigate to the prompts page to manage and create prompts used in various workflows.
  - **Files**
    - **Key**: `Files`
    - **Description**: Navigate to the files page for uploading and managing system files.

### 4. **Deployments**

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
  - **Images**
    - **Key**: `Images`
    - **Description**: Navigate to the images page to manage container images.

### 5. **Access Management**

- **Description**: A section for managing roles, keys, and folder storage.
- **Items**:
  - **Roles**
    - **Key**: `Roles`
    - **Description**: Navigate to the roles management page to assign and manage user roles.
  - **Keys**
    - **Key**: `Keys`
    - **Description**: Navigate to the keys management page for creating and managing API keys and secrets.
  - **Folders Storage**
    - **Key**: `FoldersStorage`
    - **Description**: Manage folder storage and organization for different assets and files.

### 6. **Approvals**

- **Description**: A section for managing application, toolset, prompt, and file approvals.
- **Items**:
  - **Application Publications**
    - **Key**: `ApplicationPublications`
    - **Description**: Navigate to the application publications page to review and approve application submissions.
  - **Toolset Publications**
    - **Key**: `ToolsetPublications`
    - **Description**: Navigate to the toolset publications page to review and approve toolset submissions.
  - **Prompt Publications**
    - **Key**: `PromptPublications`
    - **Description**: Navigate to the prompt publications page to review and approve prompt submissions.
  - **File Publications**
    - **Key**: `FilePublications`
    - **Description**: Navigate to the file publications page to review and approve files before they are shared.

### 7. **Evaluation** [Preview]

- **Description**: A section for managing test suites and evaluation runs.
- **Items**:
  - **Test Suites**
    - **Key**: `TestSuites`
    - **Description**: Navigate to the test suites page to create and manage test suites for evaluation.
  - **Runs**
    - **Key**: `Runs`
    - **Description**: Navigate to the runs page to view and manage evaluation run history and results.

### 8. **Audit**

- **Description**: A section for accessing telemetry data, logs, and audit information.
- **Items**:
  - **Dashboard**
    - **Key**: `Dashboard`
    - **Description**: Navigate to the telemetry dashboard to view system metrics, performance, and usage statistics.
  - **Activity Audit**
    - **Key**: `ActivityAudit`
    - **Description**: Navigate to the activity audit page to track system activities and user actions.
  - **Usage Log**
    - **Key**: `UsageLog`
    - **Description**: Navigate to the usage log page to view detailed usage logs and analytics.
