## MODIFIED Requirements

### Requirement: Core asset create option per container type

On the container detail page, a RUNNING container SHALL offer to create a Core asset of the type
that container serves:

| Container | Core asset |
| --- | --- |
| ADAPTER | model in the `platform` bucket |
| INTERCEPTOR | interceptor in the `platform` bucket |
| APPLICATION | application in the `platform` (default) or `public` bucket |
| MCP | toolset in the `platform` (default) or `public` bucket |
| Model Serving, text generation | model in the `platform` bucket |
| Model Serving, text classification | toolset in the `platform` (default) or `public` bucket |

Choosing the option SHALL open the same create modal the asset type's own Assets list uses, pre-filled
per "Core asset template per container type", so the written body carries no field that list would
not write (for example no `version` on a model or interceptor). Saving it SHALL write exactly one Core asset and SHALL NOT create or modify any
admin-backend entity. A container that is not RUNNING SHALL offer no create action, as today.

#### Scenario: Adapter container creates a Core model

- **WHEN** a user opens a RUNNING adapter container and chooses the Core option
- **THEN** the asset create modal opens for a model
- **AND** saving it writes one model to the `platform` bucket and makes no admin-backend request

#### Scenario: Toolset and application creates open on the platform bucket

- **WHEN** a user chooses the Core option on a RUNNING MCP or application container
- **THEN** the asset create modal shows the `platform` and `public` roots in its folder tree
- **AND** `platform` is selected when the modal opens

#### Scenario: A toolset or application can be created in the public bucket

- **WHEN** the user selects a folder under `public` in that modal and saves
- **THEN** the asset is written to the selected `public` folder with the version the modal shows,
  carrying the same routing fields as the platform create

#### Scenario: Stopped container offers nothing

- **WHEN** a user opens an adapter, interceptor, application or MCP container that is not RUNNING
- **THEN** no create action is shown
