## Context

Issue #5147 migrates legacy `Dial*` ui-kit components to their 2.0 counterparts, one component per change. ui-kit 0.15.3 ships `Label`, `ConfirmationPopup` and `NoDataContent` under `components/New/`, and `Spinner` (the renamed `DialSpinner`) at `components/Spinner/`. `Spinner` is the replacement for `DialLoader`; the issue's "no match in `New/`" only means it lives outside that folder.

Call sites: `DialLoader` 145 in 127 files, `DialNoDataContent` 72 in 57, `DialConfirmationPopup` 74 in 42, `DialLabel` 62 in 51. 22 specs mock `DialLoader` by name.

## Goals / Non-Goals

**Goals:**
- Replace all four legacy components in app source and specs, keeping layout and behaviour as they are today.
- Land as one reviewable PR with both typecheck gates at zero.

**Non-Goals:**
- Fixing missing `htmlFor`, enabling `NoDataContent` `live`, restyling spinners, or migrating other legacy components (see proposal).

## Decisions

### Spinner: pin `size` and `fullWidth` at every call site
Defaults differ: `DialLoader` is `size=18, fullWidth=true`; `Spinner` is `size=40, fullWidth=false`. A rename alone would silently resize and un-centre the bare loaders.

| Legacy call | Migrated call |
|---|---|
| `<DialLoader />` | `<Spinner size={18} fullWidth />` |
| `<DialLoader size={N} />` | `<Spinner size={N} fullWidth />` |
| `<DialLoader size={N} fullWidth={false} />` | `<Spinner size={N} fullWidth={false} />` |

`fullWidth` is written explicitly on every site, including `true`, so a reader never has to know the kit's default. Alternative considered: accept the 2.0 defaults and fix regressions as found. Rejected, since the issue requires migrations to keep existing behaviour.

### Spinner: colour and `iconClassName`
The ring uses `border-secondary` / `border-t-accent` internally and `Spinner` has no `iconClassName`. Consequences:
- `className="text-primary"` / `text-secondary` on loaders (6 sites: `ResultArea`, `Notification`, `Runs/Export` `Columns` and `Preview`, `DeploymentExternalLink`, `TestSuites/Properties`) has no visual effect; drop the colour class and keep any layout classes.
- `StatusBadge.tsx` passes `iconClassName={textClassName}` to tint its 12px spinner to the status colour. This is the only real loss: it renders the default ring colour after migration. Accepted as the 2.0 look; flagged here so review knows it is deliberate.

Alternative considered: wrap `Spinner` in a local component to re-add tinting. Rejected as inventing a shape the kit does not have, for one site.

### ConfirmationPopup: dividers
`DialPopup` defaulted `dividers` and `dividerFooter` to true; the 2.0 `Popup` defaults `headerDivider` and `footerDivider` to false, and the 2.0 `ConfirmationPopup` footer draws its own top border. We accept the 2.0 defaults for all popups. The two sites that pass `dividers` explicitly (`ActivityAudit/Modals/Confirmation.tsx`, `Deployments/Modals/ContainerNodePoolModal/ContainerNodePoolModal.tsx`) become `headerDivider footerDivider`, since `ConfirmationPopupProps` extends `PopupProps`.

### NoDataContent
Rename only. `containerClassName` → `className` at its two uses (`SessionEventStream.tsx`, `SessionTraceList.tsx`). `title`/`description` widen from `string` to `ReactNode`, so existing call sites type-check unchanged.

### Label
Rename only. The new `size` and `containerClassName` props are not used. The caption info button is now a sibling of the `<label>` rather than a child; no call site depends on it being inside.

### Mechanics
Mostly mechanical, so do it per component (imports, JSX, spec mocks) with a codemod or scripted replace and then review the diff, not by hand across ~230 files. Import from `@epam/ai-dial-ui-kit` as today. Spec mocks of `DialLoader` in `test-setup.tsx` or inline specs switch to `Spinner`; tests keep asserting on role/aria names per `testing.md`. Check the ui-kit MCP (`getEntityDetails`) for the real props before touching the odd sites.

## Risks / Trade-offs

- [Hidden layout change at a loader] → pin `size` and `fullWidth` everywhere; scan sites where a parent relied on `w-full h-full`.
- [Mocks named `DialLoader` miss a rename and a spec silently passes against the real component] → grep for `DialLoader` across specs and `test-setup.tsx` after the change; none may remain.
- [Visual drift: popup dividers, description type scale, spinner look/colour] → accepted 2.0 behaviour; list in the PR description.
- [Large diff] → one PR was a deliberate choice; keep commits per component so the history stays readable and revertable.

## Open Questions

None. The nine consolidated specs that name the legacy components get MODIFIED deltas that only rename the component.
