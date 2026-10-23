## MODIFIED Requirements

### Requirement: Accessibility unchanged
The fork button and modal title MUST continue to expose their visible labels through the existing `PrimaryButton` and `DialFormPopup` components from `@epam/ai-dial-ui-kit`, which already render semantic elements with accessible names from their `label` / `header` props. No new ARIA attributes SHALL be introduced.

#### Scenario: Screen reader on the rename button
- **WHEN** a screen reader reads the fork button after the user changes `name`
- **THEN** the announced name is "Save as new image"
