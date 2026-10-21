## MODIFIED Requirements

### Requirement: Accessibility
The Save and Save-as-new-version buttons MUST expose their visible labels through `PrimaryButton` / `OutlinedButton` from `@epam/ai-dial-ui-kit`, which render semantic `<button>` elements with accessible names. No new ARIA attributes are introduced.

#### Scenario: Keyboard navigation
- **WHEN** the user tabs through the header on a BUILT image with metadata-only changes
- **THEN** focus reaches Discard, Save as new version, and Save in DOM order, each with a visible label and focus ring
