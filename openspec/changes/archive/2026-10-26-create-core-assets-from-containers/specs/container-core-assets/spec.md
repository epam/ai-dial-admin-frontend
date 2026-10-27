## Purpose

Lets an admin turn a running Deployment Manager container into a routable DIAL Core asset (model,
interceptor, platform application or platform toolset) directly, with or without the admin backend.

## ADDED Requirements

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

- **WHEN** a user chooses the Core option on a RUNNING MCP or application container while Catalog is
  enabled
- **THEN** the asset create modal shows the `platform` and `public` roots in its folder tree
- **AND** `platform` is selected when the modal opens

#### Scenario: A toolset or application can be created in the public bucket

- **WHEN** the user selects a folder under `public` in that modal and saves
- **THEN** the asset is written to the selected `public` folder with the version the modal shows,
  carrying the same routing fields as the platform create

#### Scenario: Public bucket only when Catalog is disabled

- **WHEN** Catalog is disabled and a user chooses the Core option on a RUNNING MCP or application
  container
- **THEN** the modal shows only the `public` root and creates there, as the Assets list does

#### Scenario: Stopped container offers nothing

- **WHEN** a user opens an adapter, interceptor, application or MCP container that is not RUNNING
- **THEN** no create action is shown

### Requirement: Create action shape depends on admin API availability

When the admin API is available (`adminApiEnabled` true), the Create action SHALL be a dropdown
with two options:
- the admin-backend entity, labelled with its type as today;
- the Core asset, labelled with the asset type prefixed "Asset" ("Asset model" for an adapter
  container, "Asset interceptor", "Asset application", "Asset toolset").

When the admin API is unavailable, the Create action SHALL be a single button with no dropdown. It
SHALL be labelled "Create <type>" with no "Asset" prefix, and "Create model" for an adapter
container. It SHALL open the Core asset create modal.

#### Scenario: Both options with the admin API

- **WHEN** `DIAL_ADMIN_API_URL` is set and a user opens a RUNNING interceptor container
- **THEN** the Create action is a dropdown offering "Interceptor" and "Asset interceptor"

#### Scenario: Single button without the admin API

- **WHEN** `DIAL_ADMIN_API_URL` is unset and a user opens a RUNNING adapter container
- **THEN** the page shows one "Create model" button and no dropdown
- **AND** clicking it opens the Core model create modal

#### Scenario: MCP without the admin API

- **WHEN** `DIAL_ADMIN_API_URL` is unset and a user opens a RUNNING MCP container
- **THEN** the page shows one "Create toolset" button that opens the Core toolset create modal

### Requirement: Core asset template per container type

The create modal SHALL be pre-filled with `name` and display name derived from the container, as
the admin-backend template already does, plus the routing fields below. `url` is the container's
`url` as returned by the Deployment Manager, used without modification.

| Source | Routing fields |
| --- | --- |
| ADAPTER | `type` chat; `baseUrl` = `url`; `interfaces` = `{ openaiChatCompletions: {} }` |
| INTERCEPTOR | `baseUrl` = `url`; `interfaces` = `{ openaiChatCompletions: {} }` |
| APPLICATION | `base_url` = `url`; `interfaces` = `{ openaiChatCompletions: {} }` |
| MCP | `endpoint` = `url`; `transport` from the container |
| Model Serving, text generation | `type` chat; `endpoint` = `url` + `/openai/v1/chat/completions`; `overrideName` = container name |
| Model Serving, text classification | `endpoint` = `url` + `/mcp`; `transport` streamable HTTP |

The template SHALL NOT set `overrideName` for adapter, interceptor or application containers. It
SHALL NOT set `upstreams`. It SHALL NOT set an empty string in any URL field. It SHALL NOT override
the role default the platform create flow applies, so a created model, application or toolset
starts unavailable to end-users, as its "defaults to unavailable" requirement states.

#### Scenario: Adapter model routes through the interface

- **WHEN** a user saves a model created from an adapter container whose `url` is `U`
- **THEN** the written model has `baseUrl` `U`, a chat-completions interface with no `base_url` of
  its own, `type` chat, and no `endpoint`, `overrideName` or `upstreams`

#### Scenario: Interceptor routes through the interface

- **WHEN** a user saves an interceptor created from an interceptor container whose `url` is `U`
- **THEN** the written interceptor has `baseUrl` `U` and a chat-completions interface with no
  `base_url` of its own

#### Scenario: Application uses the snake-case base URL

- **WHEN** a user saves an application created from an application container whose `url` is `U`
- **THEN** the written application has `base_url` `U` and a chat-completions interface
- **AND** it is written to the bucket selected in the modal, `platform` unless the user picked `public`

#### Scenario: MCP toolset keeps the served endpoint

- **WHEN** a user saves a toolset created from an MCP container whose `url` is `U`
- **THEN** the written toolset's `endpoint` is exactly `U`, with no path appended

#### Scenario: Model Serving model uses the OpenAI v1 path

- **WHEN** a user saves a model created from a text-generation Model Serving container named `C`
  whose `url` is `U`
- **THEN** the written model has `endpoint` `U/openai/v1/chat/completions` and `overrideName` `C`

#### Scenario: Model Serving toolset appends the MCP path

- **WHEN** a user saves a toolset created from a text-classification Model Serving container whose
  `url` is `U`
- **THEN** the written toolset has `endpoint` `U/mcp` and the streamable-HTTP transport

#### Scenario: New asset starts without granted roles

- **WHEN** a user saves a model or application created from a container
- **THEN** its Roles tab shows zero granted roles and the "not available to any end-users"
  notification

### Requirement: Core asset names are validated against Core

The Core create modal SHALL reject, as the user types, a `name` that already exists for that asset
type in Core. For a `platform` destination the check SHALL cover both the `platform` bucket and the
configuration-file population. A configuration-file name SHALL be rejected there even though Core
accepts the write, because the write would replace that entity. For a `public` destination the check
SHALL cover the selected folder only, as the Assets list does, because a public asset is addressed by
its folder path and cannot replace a configuration-file entity. The check SHALL read names from Core only and SHALL NOT call
the admin backend.

The existing name rules SHALL still apply (`getErrorForName`: length 2–255, no `% / \ ;`, no
spaces). So SHALL the toolset name rule (letters, digits, `-` and `_` only).

A save that Core rejects (409 for a name held by another type, 412 for a concurrent create, 422 for
an invalid body) SHALL surface through the modal's existing error notification. The modal SHALL
stay open.

#### Scenario: Name taken in the platform bucket

- **WHEN** a model named `X` exists in the `platform` bucket and the user types `X` in the Core
  model create modal
- **THEN** the "This ID already exists" error is shown immediately and Save is disabled

#### Scenario: Name taken in the configuration file

- **WHEN** an interceptor named `X` exists only in Core's configuration file and the user types `X`
  in the Core interceptor create modal
- **THEN** the "This ID already exists" error is shown immediately and Save is disabled

#### Scenario: A configuration-file name is allowed in the public bucket

- **WHEN** a toolset named `X` exists only in Core's configuration file and the user selects a
  `public` folder in the Core toolset create modal and types `X`
- **THEN** no duplicate error is shown for `X`

#### Scenario: Name held by another type

- **WHEN** the user saves a Core model whose name is already used by an application
- **THEN** the existing error notification shows Core's rejection and the modal stays open

#### Scenario: No admin-backend lookup

- **WHEN** the Core create modal validates a name
- **THEN** no admin-backend request is made
