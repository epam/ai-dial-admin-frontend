# publication-approval-notifications Specification

## Purpose

Defines the success-notification feedback shown to a reviewer after completing a Delete, Decline,
Publish, or Unpublish action in the Approvals (Publications) review flow, across all publication
types.

## Requirements

### Requirement: Success notification on publication delete
The system SHALL show a success notification when a publication request is deleted, naming the
publication-type entity and the request's name, with no rollback wording.

#### Scenario: Deleting a publication request shows a success toast
- **WHEN** a reviewer confirms deleting a publication request and the delete succeeds
- **THEN** a success notification appears with a title naming the publication-type entity (e.g.
  "Application Publication was deleted successfully.") and a description naming the specific
  request (e.g. "Application Publication my-request has been deleted."), with no mention of
  rollback or restoration

### Requirement: Success notification on publication decline
The system SHALL show a success notification when a publication request is declined, naming the
publication-type entity and the request's name, with no rollback wording.

#### Scenario: Declining a publication request shows a success toast
- **WHEN** a reviewer submits a decline reason and the decline succeeds
- **THEN** a success notification appears with a title naming the publication-type entity (e.g.
  "Toolset Publication was declined successfully.") and a description naming the specific request
  (e.g. "Toolset Publication my-request has been declined."), with no mention of rollback or
  restoration

### Requirement: Success notification on publish (approve an add-type publication)
The system SHALL show a success notification when an add-type publication request is approved
(published), naming the publication-type entity and the request's name, with no rollback wording.

#### Scenario: Publishing an add-type publication request shows a success toast
- **WHEN** a reviewer confirms approval of a publication request whose action is add (or
  add-if-absent) and the approval succeeds
- **THEN** a success notification appears with a title naming the publication-type entity (e.g.
  "Prompt Publication was published successfully.") and a description naming the specific request
  (e.g. "Prompt Publication my-request has been published."), with no mention of rollback or
  restoration

### Requirement: Success notification on unpublish (approve a delete-type publication)
The system SHALL show a success notification when a delete-type publication request is approved
(unpublished), naming the publication-type entity and the request's name, with no rollback wording.

#### Scenario: Unpublishing a delete-type publication request shows a success toast
- **WHEN** a reviewer confirms approval of a publication request whose action is delete and the
  approval succeeds
- **THEN** a success notification appears with a title naming the publication-type entity (e.g.
  "File Publication was unpublished successfully.") and a description naming the specific request
  (e.g. "File Publication my-request has been unpublished."), with no mention of rollback or
  restoration

### Requirement: Publication-type-specific entity label
The system SHALL identify the affected entity in each of these four notifications by a label
specific to the publication's type — Application Publication, Toolset Publication, Prompt
Publication, File Publication, Conversation Publication, or Skill Publication — rather than the
generic "Publication" label used elsewhere in the review flow.

#### Scenario: Each publication type shows its own label
- **WHEN** a Delete, Decline, Publish, or Unpublish success notification is shown for a publication
  of a given type
- **THEN** the notification's entity name matches that type (e.g. a Skill publication's notification
  reads "Skill Publication", never the generic "Publication")

### Requirement: No success notification on failure
The system SHALL NOT show a success notification when a Delete, Decline, Publish, or Unpublish
action fails; the existing error notification behavior for that action is unchanged.

#### Scenario: A failed action shows only the existing error toast
- **WHEN** a Delete, Decline, Publish, or Unpublish action fails
- **THEN** no success notification appears, and the existing error notification is shown as before
