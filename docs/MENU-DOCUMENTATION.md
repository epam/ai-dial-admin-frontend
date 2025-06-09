# Menu Documentation

This documentation describes the structure and contents of the menu items array used in the application. Each entry corresponds to a menu section with various properties, including its title, description, icon, and links to different routes.

---
## Menu Sections

### 1. **Entities**
- **Description**: A section that manages entities like models, applications, assistants, addons, and routes.
- **Items**:
  - **Models**
    - **Key**: `Models`
    - **Description**: Navigate to the models page, where you can view and manage the available models.
  - **Applications**
    - **Key**: `Applications`
    - **Description**: Navigate to the applications page to manage and view all applications.
  - **Assistants**
    - **Key**: `Assistants`
    - **Description**: Navigate to the assistants page, where users can view and configure virtual assistants.
  - **Addons**
    - **Key**: `Addons`
    - **Description**: Navigate to the addons page to manage external integrations and add-ons.
  - **Routes**
    - **Key**: `Routes`
    - **Description**: Navigate to the routes page to manage the routes in the system.

### 2. **Builders**
- **Description**: A section that provides access to tools for building applications.
- **Items**:
  - **Application Runners**
    - **Key**: `ApplicationRunners`
    - **Description**: Navigate to the page for managing and running applications.
  - **Interceptors**
    - **Key**: `Interceptors`
    - **Description**: View and configure interceptors that modify application behavior.
  - **Adapters**
    - **Key**: `Adapters`
    - **Description**: Navigate to the adapters page to configure integrations and connectors.

### 3. **Assets**
- **Description**: A section for managing assets like prompts and files.
- **Items**:
  - **Prompts**
    - **Key**: `Prompts`
    - **Description**: Navigate to the prompts page to manage and create prompts used in various workflows.
  - **Files**
    - **Key**: `Files`
    - **Description**: Navigate to the files page for uploading and managing system files.

### 4. **Access Management**
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

### 5. **Approvals**
- **Description**: A section for managing prompt and file approvals.
- **Items**:
  - **Prompt Publications**
    - **Key**: `PromptPublications`
    - **Description**: Navigate to the prompt publications page to review and approve prompt submissions.
  - **File Publications**
    - **Key**: `FilePublications`
    - **Description**: Navigate to the file publications page to review and approve files before they are shared.

### 6. **Telemetry**
- **Description**: A section for accessing telemetry data and logs.
- **Items**:
  - **Dashboard**
    - **Key**: `Dashboard`
    - **Description**: Navigate to the telemetry dashboard to view system metrics, performance, and usage statistics.
  - **Usage Log**
    - **Key**: `UsageLog`
    - **Description**: View usage logs to monitor how resources are used across the system.
  - **Activity Audit**
    - **Key**: `ActivityAudit`
    - **Description**: Navigate to the activity audit page to track system activities and user actions.
