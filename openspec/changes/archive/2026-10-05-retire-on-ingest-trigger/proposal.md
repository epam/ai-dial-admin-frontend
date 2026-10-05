## Why

ADAS retires the `on_ingest` trigger kind and the `advanced.scan_every` knob (ADAS change
`retire-on-ingest-trigger`, runner contract 3). `on_ingest` was a fixed-delay timer over the same row scan a
`schedule` pipeline runs, and its name promised event-driven delivery it never had. After that change ADAS
answers a write carrying `on_ingest` with HTTP 422 and one carrying `advanced.scan_every` with HTTP 400, so
the console as it stands produces saves the service refuses: its trigger fallback is `on_ingest`, it offers
`on_ingest` as a radio, and it presents `scan_every` as an Advanced input.

ADAS also gives an enrich `schedule` trigger without a cron a default on every write: every minute, at a
second derived from the pipeline name (`S * * * * *`). The console can rely on that default instead of
making the author pick a cron.

## What Changes

- **BREAKING** The `on_ingest` trigger kind is removed from the console: the model enum, the trigger radio,
  the listing badge and its i18n key. An enrichment's trigger kind is `schedule` or `group`.
- **BREAKING** `advanced.scan_every` is removed: the model member, the Advanced input and its i18n keys. The
  Advanced block keeps rows per scan, rows per call, rate per minute and sample fraction.
- The trigger fallback, used when a trigger member is edited on a pipeline that has no trigger, becomes
  `schedule` rather than `on_ingest`.
- The create modal still collects no trigger, but an **enrichment** pipeline it registers carries
  `trigger: {kind: "schedule"}` with no cron, so the service stores its every-minute default and the
  pipeline's page opens with a cadence already declared. Aggregate registration is unchanged.
- The cron control gains an **Every minute** preset that matches any `N * * * * *` (second 0–59), so a
  service-defaulted cron reads as _Every minute_ rather than as a raw _Custom_ expression. On an enrichment
  pipeline it is also what an absent cron reads as, and choosing it sends no cron, so the service derives
  the second. It is not offered for an aggregate pipeline, whose cron the service still requires and never
  defaults. On an enrichment pipeline the cron is no longer marked required.
- The spec stops naming `on_ingest` as an example anywhere it describes runtime presentation.

## Non-goals

- A 30-second preset. ADAS leaves it a UI decision and recommends against it (10 s polling floor,
  minute-scale ingest lag); `*/30 * * * * *` stays reachable as a custom expression.
- Computing the name-derived second in the console. The service owns that derivation; the console only
  omits the cron.
- Any change to the group trigger's controls. Its mark-scan cadence moves to runner config
  (`GROUP_SCAN_CADENCE`) and was never a console control beyond `scan_every`.
- Translating historical audit snapshots: ADAS already reads a pre-migration `ON_INGEST` revision back as
  `schedule`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics/pipelines`: the trigger-members requirement loses the `on_ingest` branch and states that an
  enrichment `schedule` without a cron is defaulted by the service; the cron-control requirement gains the
  Every minute preset and its enrich-only, cron-optional behaviour; the create-modal requirement states the
  enrichment registration's implicit `schedule` trigger; the Advanced-knobs requirement drops the scan
  cadence; the runtime-state and save requirements restate their `on_ingest` examples.

## Impact

- **Code** (`apps/ai-dial-admin/src`): `models/analytics/pipeline.ts` (`TriggerKind`, `PipelineAdvanced`),
  `components/Analytics/Pipelines/Enrich/EnrichSection.tsx`, `Common/TriggerCell.tsx`,
  `Common/use-pipeline-form.ts`, `Common/CronField.tsx`, `CreatePipelinePopup.tsx`, `constants/analytics/pipelines.ts`,
  `utils/analytics/cron.ts`, `constants/i18n.ts`, `locales/en.ts`.
- **Tests**: about twenty spec files use `TriggerKind.OnIngest` as a fixture and move to `Schedule`; the
  `scan_every` cases in `PipelineDetailView.spec`, `PipelineDetailPermissions.spec`, `use-enrich-form.spec`
  and `pipeline-dto.spec` are removed or rewritten against a remaining knob.
- **API**: no new endpoint. `POST /v1/pipelines` for an enrichment now carries a trigger; `PATCH` never
  carries `advanced.scan_every` or `on_ingest`.
- **Deploy order**: this console change MUST ship with or after the ADAS change. Against an older ADAS an
  enrichment registered from the modal arrives with `schedule` and no cron, which that ADAS stores and
  refuses at arming until a cron is chosen — degraded, not broken.
