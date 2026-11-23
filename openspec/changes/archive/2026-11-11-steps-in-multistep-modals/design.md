## Context

`CreateTestSuite` is the exemplar: one `Popup`, a fixed-height body, `<Steps>` on top, conditional step content, and
`StepperModalButtons` as footer. The five outlier modals instead return a different `Popup` per step and build
their footer with `getFormPopupButtons`.

Facts that shape the design:
- ui-kit `Steps` (0.16.0) renders `Step { id, name, status?, disabled? }`. A step is enterable only when all steps
  before it are `VALID`, or when it is earlier than the current one; `disabled` blocks entering a step outright.
- `StepperModalButtons` shows Back (not on step 1), Cancel, then Next, or Finish on the last step. Next requires the
  current step `VALID`; Finish requires **every** step `VALID`.
- The key modals' last screen (reveal) happens **after** the create call succeeded; the secret is shown once.

## Goals / Non-Goals

**Goals:**
- Every multi-step create/duplicate/rotate modal shows `Steps` and one stable dialog.
- The post-action reveal is a real, final, locked step.
- Reuse existing components; the only API addition is one optional prop.

**Non-Goals:**
- Changing `Steps` in the kit; changing create/rotate semantics; touching wizards already on `Steps`.

## Decisions

### 1. Informative last step = `isLastStepInformative` on `StepperModalButtons`

With the prop set (n = number of steps):

| Current step | Buttons |
|---|---|
| before n-1 | Back (if not first) · Cancel · Next (unchanged) |
| n-1 (second to last) | Back (if not first) · Cancel · **Finish** (`finishButtonLabel`, calls `onFinishClick`) |
| n (informative) | **Close** only (calls `onClose`) |

- Finish enablement ignores the informative step: all steps **before** it must be `VALID`, and `isLoading` disables it.
- Close is a `PrimaryButton` with `ButtonsI18nKey.Close`; it is the only action on that screen.
- Without the prop, behavior is unchanged.

*Alternatives:* a `nextButtonLabel` prop plus a finish-only prop (two props, and a "Next" button would still trigger
the API call); a new `RevealStepButtons` component (rejected: prefer reuse); inferring finish-only from earlier
steps being `disabled` (hidden coupling).

### 2. Locking earlier steps stays in the modal, via `Step.disabled`

On the informative step each modal maps earlier steps to `{ ...step, disabled: true }`, keeping `status: VALID` so
they show a check mark. `StepperModalButtons` knows nothing about this. No kit change.

*Trade-off:* the kit styles `disabled` steps with `text-control-disable-primary`, so completed step names look
greyed. This reads as "locked" and is accepted; if design objects, the follow-up is a one-line kit change letting
`disabled` + `VALID` keep the normal label color.

### 3. Step status is derived, not stored

Each modal builds its `steps` array with `useMemo` from validity flags it already computes (`isDetailsValid`,
`isRolesValid`, `isSourceValid`, `areRulesValid`) and the current step. This avoids the `useState` + `setSteps`
sync pattern in `ContainerCreate`. Step names reuse existing i18n keys where they exist; new keys are added only
for names that have none (e.g. the key-reveal step name).

### 4. One `Popup`, stable body height

Each modal renders a single `Popup` with `Steps` above the step content. Modals with a grid step (key Roles) use a
fixed body height so the dialog does not jump between steps; others bound the body with `max-h` and `overflow-auto`
(Application source stays at 540px per the existing requirement). Per-step `portalId`s collapse to one per modal.

### 5. Step-specific behavior that must be preserved

- Key modals cannot use `handleCreateAsset` (it closes on success); they keep calling `createKey` directly, then move
  to the reveal step. Close on the reveal step still runs `onCloseAndReset`, which navigates to the key detail.
- The Roles-step loader (`PopupLoader` while creating) stays; `isLoading` also disables Finish.
- `CreatePolicyModal` keeps its heading-focus management on step change and keeps the details form mounted but
  `hidden` on the Subjects step, so entered values and validation survive Back.
- Header close (X/Esc) keeps calling the modal's existing `onClose` / `onCloseAndReset`.

### 6. The rule

Add to `.claude/rules/components.md` §5: any wizard or multi-step flow uses `Steps` (with `getStepStatusLabels`) and
`StepperModalButtons`; no hand-rolled step swap or bespoke indicator; a trailing informative step uses
`isLastStepInformative` with earlier steps `disabled`. Add `CreateTestSuite` to §12 exemplars. Only the `.claude`
file is edited; the mirrors regenerate on pre-commit.

## Risks / Trade-offs

- [`StepperModalButtons` is shared by 8 wizards] → default-off prop; existing specs must pass unchanged, plus new cases.
- [Greyed completed-step labels on reveal] → accepted (Decision 2); kit follow-up documented.
- [Rotate and Duplicate have a thin first step (a confirm, a name field)] → accepted per request; consistency over minimalism.
- [Current specs assert per-step portal ids and popups] → rewrite them around roles and accessible names.
- [Focus after step change on the reveal screen] → `Steps` marks `aria-current="step"`; verify the Close button remains
  reachable and focus is not lost when the footer swaps buttons.
