## 1. DialAnalytics* → Analytics*

- [x] 1.1 Replace `DialAnalyticsCard`, `DialAnalyticsBarGroup` and `DialAnalyticsHistogram` with `AnalyticsCard`, `AnalyticsBarGroup` and `AnalyticsHistogram` in `Runs/Summary/` (`Analytics.tsx`, `DistributionSection.tsx`, `MetricScoresSection.tsx`) and `Runs/Compare/Summary/` (the same three files plus `models.ts`); update the comments in `Summary/utils.ts`, `Summary/constants.ts`, `Compare/Summary/utils.ts` and `MetricGroupTitle.tsx` that name the legacy components
- [x] 1.2 Check the three kit-internal dependencies against the 2.0 source: the `[data-histogram-y-axis]` selector in both `DistributionSection`s (drop the override if the attribute is gone), `barClassName` on `AnalyticsBarGroup`, and the `MetricGroupTitle` tooltip; record any removal in the PR
- [x] 1.3 Update the seven specs that mock `DialAnalyticsCard`, `DialAnalyticsBarGroup` or `DialAnalyticsHistogram` (`Runs/Summary` ×3, `Runs/Compare/Summary` ×3, `TestSuites/Trends/Trends.spec`); run both typecheck gates

## 2. DialSteps → Steps

- [x] 2.1 Add a shared `statusLabels` helper in `Common/` that returns the translated `Completed` / `Error` pair for `StepStatus`, reusing existing i18n keys where they exist and adding new ones to `locales/en.ts` and the matching `*I18nKey` enum otherwise; add its spec
- [x] 2.2 Replace `DialSteps` with `Steps` in `ImportModal`, `ImportConfig`, `ContainerCreate`, `ImportFile`, `CreateTestSuite`, `EditRequestWizard`, `PickPublicDataset` and `AddMetricModal`, passing `ariaLabel` (the wizard's own title key) and `statusLabels` at each site
- [x] 2.3 Update the two specs that mock `DialSteps` (`AddMetricModal.spec`, `CreateTestSuite.spec`) and any wizard spec that now needs the mock to accept `ariaLabel` / `statusLabels`; run both typecheck gates

## 3. DialLabelledText → LabelledText

- [x] 3.1 Switch `Common/LabelledText/LabelledText.tsx` to the kit's `LabelledText`, keeping its props and the copy-button `postfix`
- [x] 3.2 Replace `DialLabelledText` with `LabelledText` in `Containers/View/TabsContent`, `Images/View/TabsContent`, `McpServerDetails`, `Analytics/Tables/TableProperties`, `Assets/Header/FolderStorage`, `Assets/Modals/CreateAsset`, `TestSuites/Runs/RunModal`, `Analytics/Pipelines/Common/PipelineReadOnlyFacts`, `Runs/Summary/Header` and `Runs/Compare/Summary/Header`
- [x] 3.3 Check that `PipelineRuntime`'s `max-w-none` still reaches the element carrying the 200px cap, and update its comment to name `LabelledText`
- [x] 3.4 Update every spec that mocks or asserts on `DialLabelledText`; run both typecheck gates

## 4. Close out

- [x] 4.1 Grep `apps/ai-dial-admin` for `DialSteps`, `DialAnalytics` and `DialLabelledText`; none may remain in source, specs or `test-setup.tsx`
- [x] 4.2 Trim the `tooltip.scss` comment so it no longer names `DialLabelledText` and `DialAnalytics*`; the shim stays
- [x] 4.3 Update `docs/` and any `.claude/rules` text that names the legacy components, if present
- [x] 4.4 Run `npm run lint`, both typecheck gates and the affected specs
