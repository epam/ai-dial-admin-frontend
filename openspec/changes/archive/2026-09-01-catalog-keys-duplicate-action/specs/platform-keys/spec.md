## ADDED Requirements

### Requirement: Duplicate action in Catalog Keys context menu
The Catalog Keys list (flat platform view at `/platform-keys`) SHALL expose a **Duplicate** item in each row's three-dot context menu alongside the existing Delete and Open-in-new-tab items.

#### Scenario: Duplicate action is visible in the context menu
- **WHEN** an admin right-clicks (or opens the three-dot menu) on a row in the Catalog Keys list
- **THEN** the context menu includes a "Duplicate" option

#### Scenario: Read-only admin sees no action items
- **WHEN** the current user has read-only admin rights
- **THEN** the context menu for Catalog Keys rows is empty (no Duplicate, no Delete)

---

### Requirement: Duplicate modal — name step
When the user selects Duplicate, a modal SHALL open that allows entering a new name for the clone.

#### Scenario: Modal pre-fills a cloned name
- **WHEN** the user opens the Duplicate modal for a key named `my-key`
- **THEN** the Name field is pre-filled with a modified version of the source name (e.g., `my-key_copy`)

#### Scenario: Submitting with a unique name proceeds
- **WHEN** the user enters a name that does not conflict with any existing key name and submits
- **THEN** the system creates the new key with a freshly generated value, copying `project` and `roles` from the source entity

#### Scenario: Submitting with a duplicate name is blocked
- **WHEN** the user enters a name already used by another key in the same folder
- **THEN** the submit button remains disabled and a validation message is shown

---

### Requirement: Duplicate modal — reveal step
After the new key is successfully created, the modal SHALL display the generated key value so the user can copy it.

#### Scenario: Reveal step shows the generated key
- **WHEN** the create call succeeds
- **THEN** the modal transitions to a Reveal step that shows the generated key value with a copy button

#### Scenario: Closing the reveal step dismisses the modal
- **WHEN** the user clicks Close on the Reveal step
- **THEN** the modal closes and the list refreshes to show the new entry

#### Scenario: Project and roles are silently copied
- **WHEN** the new key is created via the Duplicate flow
- **THEN** the `project` and `roles` values are identical to those of the source entity, without the user having to re-enter them
