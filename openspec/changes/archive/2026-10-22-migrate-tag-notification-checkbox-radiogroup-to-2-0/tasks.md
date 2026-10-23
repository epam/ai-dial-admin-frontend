## 1. Notification

- [x] 1.1 Script the rename over `apps/ai-dial-admin/src` (import specifier, opening and closing tag): `DialNotification`→`Notification`; list any site with an unexpected prop instead of rewriting it
- [x] 1.2 Add `type={NotificationType.SectionMessage}` to every in-page banner (`Common/ReadOnlyBanner`, `Deployments/Common/EntityBanner`, `CatalogProperties/UndeclaredPropertiesBanner`, `ImportConfig/ConfigurationPreview/*`, `Datasets/Schema/SchemaTab`, and the other sites the script listed); keep `children` as the CTA slot
- [x] 1.3 Confirm no `DialNotification` import remains

## 2. Checkbox

- [x] 2.1 Script the rewrite: `DialCheckbox`→`Checkbox`, `checked`→`isSelected`, `indeterminate`→`isIndeterminate`, `label={x}`→`labelProps={{ label: x }}`, `ariaLabel`→`aria-label`; make the script list any site with `className`, a non-simple `label`, or an `onChange` using its second argument
- [x] 2.2 Hand-edit the listed sites; drop `!!v` guards on `onChange` (`Assets/Resources/Auth/ResourceLogoutPopup.tsx`); check the `pl-[20px]` indent in `ExportConfig/AddEntities/Dependencies.tsx` against the 2.0 box width
- [x] 2.3 Confirm no `DialCheckbox`, `checked=` or `indeterminate=` remains on a `Checkbox`

## 3. RadioGroup

- [x] 3.1 Add `toRadioItems` next to `RadioButtonWithContent` in `models/`: `id`→`value`, `name`→`label`, pass `content` and `caption` through
- [x] 3.2 Rewrite the ~22 call sites: `DialRadioGroup`→`RadioGroup`, `radioButtons`→`items={toRadioItems(…)}`, `activeRadioButton`→`value`, `elementId`→`id`, `fieldTitle`→`labelProps={{ label }}`, `labelDescription`→`caption`
- [x] 3.3 Inspect each site that passes a legacy `*ClassName` prop (`containerClassName` in `Assets/Platform/Routes/Properties.tsx`, and the rest the grep lists) and drop it or move it to `className` / `optionsClassName` / `radioClassName`
- [x] 3.4 Confirm no `DialRadioGroup`, `radioButtons`, `activeRadioButton` or `fieldTitle` remains

## 4. Tag and Badge

- [x] 4.1 Move the status-style sites to `Badge` (`Common/ReadOnlyBadge`, `Assets/Resources/Auth/ExternalServiceConsentActions`, `Grid/CellRenderers/TestCaseNameCellRenderer`, `Assets/Modals/utils`), mapping the encoded colour to `BadgeColor` and dropping the `h-4` / `rounded-full` overrides
- [x] 4.2 Move the remaining `DialTag` sites to `Tag`; give every `closable` tag `removeLabel={t(ButtonsI18nKey.Remove)}` (`Common/MultiValueAutocomplete`, `Grid/CellRenderers/MultiSelectTagsRenderer`)
- [x] 4.3 Update both the visible and the hidden measuring clones in `MultiSelectTagsRenderer` together, and check `visibleCount` still derives from rendered widths
- [x] 4.4 Confirm no `DialTag` import remains (`DialTagInput` is out of scope)

## 5. Tests

- [x] 5.1 Update the ~19 specs that name or assert a legacy class or component to query by role and accessible name; both `typecheck` and `typecheck:specs` stay at zero
- [x] 5.2 Add a spec for `toRadioItems` (id/name mapping, `content` and `caption` pass-through, empty array)
- [x] 5.3 Add or extend specs for: `EntityBanner` (variant, title, CTA child, `className` still forwarded to `Notification`), `ReadOnlyBadge`, a closable `Tag` (remove button name from `removeLabel`, `onRemove` fires), `Checkbox` indeterminate / toggle, and a `RadioGroup` selection change
- [x] 5.4 Add a `MultiSelectTagsRenderer` spec for label fallback and the per-tag remove button name (jsdom reports zero widths, so the `+N` overflow count cannot be asserted from layout and is left to a visual check)

## 6. Specs and docs

- [x] 6.1 Check the delta specs under `openspec/changes/migrate-tag-notification-checkbox-radiogroup-to-2-0/specs/` match the final component names, and search `docs/` for legacy tag, notification, checkbox and radio-group names and update any that describe them

## 7. Quality checks

- [x] 7.1 Run `npm run typecheck`, `npm run typecheck:specs`, `npm run lint`, `npm run format` and the full vitest suite; all pass at zero errors (the coverage run was not completed, so thresholds were not checked)
