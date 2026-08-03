## 1. Bound the tooltip

- [x] 1.1 In `components/Containers/View/ExecutionLog/PodView.tsx`, render the Termination message field via `LabelledText`'s `children` with an explicit `DialTooltip` (`triggerClassName="text-primary min-w-0"`) instead of the `text` + `tooltip` props.
- [x] 1.2 Wrap the tooltip content in a `max-h-[240px] overflow-y-auto overscroll-contain` container so the floating element stays height-capped and scrolls on its own.

## 2. Tests

- [x] 2.1 In `components/Containers/View/ExecutionLog/tests/PodView.spec.tsx`, mock `DialTooltip` and let the `LabelledText` mock render `children`; add a case asserting a long message's tooltip content sits in a height-capped, `overflow-y-auto` container, so removing the cap fails the suite.
- [x] 2.2 Drop the `data-testid` attributes from that spec's mocks (`role="group"` + `aria-label` for `LabelledText`, `role="status"` for `DialNoDataContent`, `role="tooltip"` for `DialTooltip`) and query by role, per `.claude/rules/testing.md` §4.4.

No browser-verification task: the user was asked and declined — the bounded tooltip surface is asserted in the component spec.

## 3. Quality checks

- [x] 3.1 Run `npm run lint`, `npm run format:write`, and `npm run test`.
