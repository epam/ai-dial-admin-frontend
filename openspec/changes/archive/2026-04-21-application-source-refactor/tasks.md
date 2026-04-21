## Tasks

- [x] **Task 1** — Update `DialApplication` model and add `ApplicationSource` types — `src/models/dial/application.ts`: add `ApplicationEndpointsSource`, `ApplicationSchemaSource`, `ApplicationSource`; remove `customAppSchemaId`; add `source?: ApplicationSource`
- [x] **Task 2** — Add `getSchemaSourceId` utility — `src/utils/entities/application-source.ts` (new): implement `getSchemaSourceId(source?: ApplicationSource): string | undefined`
- [x] **Task 3** — Add unit tests for `getSchemaSourceId` — `src/utils/entities/tests/application-source.spec.ts` (new): three cases: undefined, endpoints, schema
- [x] **Task 4** — Update `ApplicationSource.tsx` — `src/components/SourceField/Application/ApplicationSource.tsx`: replace all `customAppSchemaId` reads/writes with `source`-based equivalents
- [x] **Task 5** — Update `getAppRunner` in `ParametersTab/utils.ts` — `src/components/Applications/ParametersTab/utils.ts`: replace `entity?.customAppSchemaId` with `getSchemaSourceId((entity as DialApplication).source)`
- [x] **Task 6** — Update `ApplicationAppRoutes.tsx` — `src/components/EntityView/AppRoute/ApplicationAppRoutes.tsx`: replace both `customAppSchemaId` usages with `source?.$type === 'schema'`
- [x] **Task 7** — Update `Interceptors.tsx` — `src/components/EntityView/Interceptors/Interceptors.tsx`: replace `customAppSchemaId` with `getSchemaSourceId`
- [x] **Task 8** — Update `CollapsableInterceptors.tsx` — `src/components/EntityView/Interceptors/CollapsableInterceptors.tsx`: replace `customAppSchemaId` condition with `getSchemaSourceId` check
- [x] **Task 9** — Update `AdditionalProperties.tsx` — `src/components/EntityMainProperties/Properties/AdditionalProperties.tsx`: replace `customAppSchemaId` lookup with `getSchemaSourceId`
- [x] **Task 10** — Update `ApplicationRunners/View/View.tsx` — `src/components/ApplicationRunners/View/View.tsx`: replace `customAppSchemaId: selectedRunner.$id` with `source: { $type: 'schema', applicationTypeSchemaId: selectedRunner.$id }`
- [x] **Task 11** — Update `getAppRunner` unit tests — `src/components/Applications/ParametersTab/tests/utils.spec.ts`: migrate `customAppSchemaId` fixtures to `source: { $type: 'schema', applicationTypeSchemaId: '...' }`
- [x] **Task 12** — Update `ParametersTab` component test — `src/components/Applications/ParametersTab/tests/ParametersTab.spec.tsx`: replace `customAppSchemaId: 'scheme1'` fixture
- [x] **Task 13** — Run lint, format, and tests — `npm run lint`, `npm run format:write`, `npm run test` from `apps/ai-dial-admin/`
