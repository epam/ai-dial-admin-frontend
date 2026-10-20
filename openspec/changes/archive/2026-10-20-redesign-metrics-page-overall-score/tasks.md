## 1. Model and helpers

- [x] 1.1 Add `TestCaseOverallScoreConfig` (Mean | WeightedMean) and `testCaseOverallScore?` on `TestSuite` and `SuiteSnapshot` in `apps/ai-dial-admin/src/models/evaluation/test-suite.ts`
- [x] 1.2 Add helpers in `ScoreSettings/utils.ts` to normalize Apply payload (clear nested for mean/weighted_mean; require nested for function) and summary labels for the card

## 2. Score Settings UI

- [x] 2.1 Add `TestCaseOverallScore.tsx` (Mean / Weighted mean radios + WeightedMean panel) writing `testCaseOverallScore`
- [x] 2.2 Update `OverallScore.tsx` so type switches clear or default `testCaseOverallScore` per design rules
- [x] 2.3 Add Enable-threshold switch to `ScoreThreshold.tsx` (off clears `overallScoreThreshold`)
- [x] 2.4 Add `EditOverallScoreModal.tsx` (DialConfirmationPopup, draft suite, nested SaveValidationContextProvider, Apply)
- [x] 2.5 Add `OverallScoreCard.tsx` (summary + Edit opens modal)
- [x] 2.6 Rework `Metrics.tsx`: hide score UI when zero metrics; show card when metrics exist; strip weighted weights from both `overallScore` and `testCaseOverallScore` on metric delete

## 3. i18n and tests

- [x] 3.1 Add i18n keys (Edit Overall Score, Test Case Score, Enable threshold, card summary strings) in `i18n.ts` + `locales/en.ts`
- [x] 3.2 Update `Metrics.spec.tsx`, OverallScore / ScoreThreshold / ScoreSettings specs; add modal/card/payload coverage
- [x] 3.3 Run focused vitest + `npm run typecheck` / `typecheck:specs` for touched files
