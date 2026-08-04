## Why

A pod's `lastTerminationMessage` is usually a full Kubernetes stack trace — hundreds of lines. In the Execution log header it is passed to `LabelledText` as both `text` and `tooltip`, and `DialLabelledText` forwards that string to `DialTooltip`. The ui-kit tooltip content caps its **width** (`max-w-[300px]`) but not its **height**: the floating element renders the whole trace at full height in a body-level portal, positioned absolutely. A multi-KB message therefore produces a ~900px+ tall node that grows the document, adds a page scrollbar, and visually breaks the surrounding layout (Issue #4072).

## What Changes

- Render the Termination message field through `LabelledText`'s `children` slot with an explicit `DialTooltip`, so the tooltip content can be styled — `DialLabelledText`'s `tooltip` prop is a plain string with no way to bound its rendering.
- Wrap the tooltip content in a height-capped, independently scrollable container (`max-h-[240px] overflow-y-auto overscroll-contain`), so the floating element stays bounded no matter how long the message is, and scrolling it does not chain to the page.
- The inline field keeps its existing single-line truncated presentation inside `max-w-[350px]`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `pod-termination-message`: `Pod termination message in Execution log header` — the requirement now states that the full message is reachable through the field's tooltip.
- `pod-termination-message`: `Long termination message` — the scenario now states that the tooltip surface itself is bounded and scrollable, not only that the inline header field is constrained. It also moves under the display requirement above; it had been sitting under `Termination message visibility is decoupled from restart count`, which is about `restartCount` gating and not about layout.

## Impact

Frontend only, one component: `components/Containers/View/ExecutionLog/PodView.tsx`, plus its spec. The cap is applied at this call site rather than in `Common/LabelledText`, because `LabelledText`/`DialLabelledText` type `tooltip` as `string` and only this field carries stack-trace-sized values. No API, model, or i18n change.

## Non-goals

- No change to `Common/LabelledText` or to the ui-kit `DialTooltip`/`DialLabelledText` contracts.
- No richer reading surface for the message (expand-to-popup, copy button, log-style viewer). The ui-kit tooltip closes as soon as the pointer leaves the trigger (`delay.close = 0`, no `safePolygon`), so on desktop the cap bounds what a hover reveals; making the full trace comfortably readable is a separate UX change.
- No change to Restarts / Last restarted at / Last reason, or to log streaming.
