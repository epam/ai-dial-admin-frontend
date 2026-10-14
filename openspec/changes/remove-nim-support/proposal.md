## Why

NVIDIA NIM Model Serving is no longer supported. The admin console still ships a NIM create flow, an NGC Registry container source, a gRPC port field, the `NIM_ENABLED` feature flag, and NIM resource types in audit, import and export. All of it is dead weight once the backend stops serving NIM, and it keeps a `v1` endpoint-prefix special case alive for no remaining caller.

## What Changes

- **BREAKING** Remove `CONTAINER_TYPE.NIM`, `MODEL_TYPE.NIM`, `CONTAINER_SOURCE_TYPE.NGC_REGISTRY`, `source.imageRef` and `containerGrpcPort`, together with the NIM create modal, the NGC Registry source field, the gRPC port input and the `ModelTypeNIM` / `NgcRegistry` / `GRPCPort` i18n keys.
- **BREAKING** Remove the `NIM_ENABLED` environment variable and the `nimEnabled` feature flag. Model Servings visibility depends on `HF_ENABLED` alone.
- **BREAKING** Remove the `NimDeployment` audit resource type and the `NIM_DEPLOYMENT` import/export component type; import previews no longer read `nimDeployments`.
- Hide `NimDeployment` rows from audit lists on the client, instead of mapping them to a label and route.
- Collapse the endpoint prefix to a constant `openai/v1`; drop the unused `container` argument of `buildContainerSelection`.
- Request model-serving containers with `?type=INFERENCE`.
- Update the consolidated specs, README, `.env.template` and `docs/INFRA-CHANGELOG.md`.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `model-servings-visibility`: one flag (`HF_ENABLED`) instead of two.
- `model-endpoint-prefix`: always `openai/v1`.
- `unified-container-source`, `container-source-field-layout`, `container-scaling-defaults`, `container-redeploy-snapshot`, `model-serving-capability-gating`, `add-model-serving-toolset-source`: NIM and NGC Registry removed.
- `activity-audit-deployments-view`: NIM label removed; new requirement hiding `NimDeployment` rows.
- `activity-audit-deployments-detail`, `activity-audit-deployments-tab`, `activity-audit-analytics-view`: NIM resource type removed, counts adjusted.
- `deployment-export`, `deployment-import-preview`, `deployment-import-preview-validation-errors`: NIM component type removed.

## Impact

- Code: `types/deployments/*`, `types/activity-audit.ts`, `constants/{activity-audit,i18n,deployments/*,grid-columns/formatters}`, `utils/{deployments,models,audit,entities}`, `components/{Containers,Deployments,SourceField,Menu,ExportConfig,ActivityAudit}`, `app/[lang]/{layout,model-servings/page}`, `server/deployments/containers.ts`, `locales/en.ts`.
- Operators: `NIM_ENABLED` is ignored and can be dropped from the deployment configuration.
- Data: existing NIM deployments are no longer listed, old NIM audit rows are hidden, and import files carrying `nimDeployments` lose that section.
