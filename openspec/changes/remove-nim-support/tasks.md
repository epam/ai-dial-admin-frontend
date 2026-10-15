## 1. Remove NIM from the model

- [x] 1.1 Remove `CONTAINER_TYPE.NIM`, `MODEL_TYPE.NIM`, `CONTAINER_SOURCE_TYPE.NGC_REGISTRY`, `source.imageRef`, `containerGrpcPort` and their i18n keys
- [x] 1.2 Remove `NIM_ENABLED` / `nimEnabled`; gate Model Servings on `HF_ENABLED` only (menu, create dropdown, route)
- [x] 1.3 Remove the NIM create modal, NGC source field and gRPC port input
- [x] 1.4 Collapse `getEndpointPrefix` to `openai/v1`; drop the `container` argument of `buildContainerSelection`; request `?type=INFERENCE`

## 2. Audit and import/export

- [x] 2.1 Remove `NimDeployment` and `NIM_DEPLOYMENT` from audit, export and import types, maps and previews
- [x] 2.2 Hide `NimDeployment` rows from audit lists on the client

## 3. Specs, docs, tests

- [x] 3.1 Update the consolidated specs and add the hide-rows requirement to `activity-audit-deployments-view`
- [x] 3.2 Update README, `.env.template` and `docs/INFRA-CHANGELOG.md`
- [x] 3.3 Update or delete the NIM-specific tests; keep `typecheck`, `typecheck:specs` and the suite green
