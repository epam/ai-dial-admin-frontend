## 1. Removal

- [x] 1.1 Drop the `Asset` entry from `activityViewOptions` in `components/ActivityAudit/List/List.tsx`.
- [x] 1.2 Remove the `Asset` member from `ActivityAuditView` in `types/activity-audit.ts` (no other references).
- [x] 1.3 Remove `TelemetryI18nKey.ActivityViewAsset` from `constants/i18n.ts` and `Telemetry.ActivityView.Asset` from `locales/en.ts`.

## 2. Tests

- [x] 2.1 Update `components/ActivityAudit/List/tests/List.spec.tsx` to assert the exact option set `['Config', 'Deployments']`, so a placeholder option reappearing fails the suite.

No browser-verification task: the change removes one dropdown entry and the option set is asserted in the component spec.

## 3. Quality checks

- [x] 3.1 Run `npm run lint`, `npm run format:write`, and `npm run test`.
