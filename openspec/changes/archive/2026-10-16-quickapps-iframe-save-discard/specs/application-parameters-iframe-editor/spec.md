## ADDED Requirements

### Requirement: Bare iframe messages are accepted only from the embedded editor
`FrameRenderer` SHALL accept the bare message types `DIRTY_STATE`, `SAVE_SUCCESS` and `SAVE_ERROR` only
when `event.source` is the embedded iframe's window and `event.origin` equals the origin of the iframe URL.
It SHALL post `TRIGGER_SAVE` and `RESET` to that iframe with the same origin as the explicit target origin.

#### Scenario: Message from the iframe is accepted
- **WHEN** the embedded iframe posts `DIRTY_STATE` with `payload.isDirty` true
- **THEN** `FrameRenderer` reports dirty to its owner

#### Scenario: Message from another window or origin is ignored
- **WHEN** a `DIRTY_STATE` message arrives whose `event.source` is not the iframe's window or whose `event.origin` differs from the iframe URL's origin
- **THEN** it is ignored

#### Scenario: Unparsable iframe URL
- **WHEN** the iframe URL cannot be parsed
- **THEN** `FrameRenderer` sends nothing and accepts no bare messages

### Requirement: Legacy prefixed protocol keeps working alongside the bare protocol
`FrameRenderer` SHALL continue to handle prefixed messages (`${name}/readyToInteract` and others forwarded to
`onMessage`) unchanged. The bare protocol SHALL be treated as active only after a bare `DIRTY_STATE` has been
received from the current iframe; before that, the view SHALL behave as it did before this capability.

#### Scenario: Legacy runner never sends DIRTY_STATE
- **WHEN** an iframe communicates only through prefixed messages
- **THEN** the header Save/Discard state, the tab guard and the save flow behave as before

#### Scenario: Iframe URL changes
- **WHEN** the iframe URL changes
- **THEN** the bare-protocol activation, dirty and saving state are cleared

### Requirement: Header Save and Discard reflect iframe dirty state
`FrameRenderer` SHALL NOT render Save or Discard controls. While the Parameters tab of the Application, Assets
Application or Platform Application view shows a bare-protocol iframe, that view's header SHALL show its
existing Save and Discard controls when the entity or the iframe is dirty, and the iframe's last reported
`isDirty` SHALL count as dirty. All three views SHALL behave identically.

#### Scenario: Iframe becomes dirty
- **WHEN** the iframe posts `DIRTY_STATE` with `isDirty` true
- **THEN** the header's Save and Discard become available

#### Scenario: Iframe becomes clean
- **WHEN** the iframe posts `DIRTY_STATE` with `isDirty` false and the entity is not changed
- **THEN** the header's Save and Discard are hidden

#### Scenario: Same behavior in asset views
- **WHEN** the iframe becomes dirty in the Assets Application or Platform Application view
- **THEN** that view's header shows Save and Discard exactly as the Application view does

#### Scenario: No duplicate controls
- **WHEN** the iframe is dirty
- **THEN** no Save or Discard control is rendered inside the iframe container by `FrameRenderer`

### Requirement: An invalid iframe form disables Save
The views SHALL disable the header Save while the embedded editor reports `VALIDITY_STATE` with `isValid`
false, SHALL treat the form as valid until told otherwise, and SHALL reset to valid when the iframe is
replaced or unmounted. The message SHALL be accepted only from the iframe's own window and origin, and only
with a boolean `isValid`.

#### Scenario: Invalid form disables Save
- **WHEN** the iframe is dirty and posts `VALIDITY_STATE` with `isValid` false
- **THEN** Save is disabled and Discard stays enabled

#### Scenario: Valid form re-enables Save
- **WHEN** the iframe then posts `VALIDITY_STATE` with `isValid` true
- **THEN** Save is enabled again

#### Scenario: Valid until told otherwise
- **WHEN** the iframe becomes dirty and has sent no `VALIDITY_STATE`
- **THEN** Save is enabled

#### Scenario: Malformed or foreign validity message is ignored
- **WHEN** a `VALIDITY_STATE` message arrives from another window or origin, or without a boolean `isValid`
- **THEN** the Save state does not change

#### Scenario: Validity resets with the iframe
- **WHEN** the iframe was invalid and is then unmounted or its URL changes
- **THEN** the form counts as valid again

#### Scenario: Asset header disables only Save
- **WHEN** the Assets Application header shows an invalid iframe form
- **THEN** Save is disabled and Save as new version is not disabled by the iframe

#### Scenario: Invalid form blocks save-then-switch
- **WHEN** the user confirms saving before leaving the Parameters tab while the form is invalid
- **THEN** no `TRIGGER_SAVE` is sent, the view stays on the Parameters tab and the generic error notification is shown

### Requirement: Header Save triggers an iframe save
When the Parameters tab shows a dirty bare-protocol iframe, activating the header Save SHALL send
`TRIGGER_SAVE` without a `general` field instead of the entity save, and SHALL disable Save until the save
resolves.

#### Scenario: Save sent without general
- **WHEN** the user activates header Save while the iframe is dirty
- **THEN** a `TRIGGER_SAVE` message without `general` is posted to the iframe and Save is disabled

#### Scenario: Save as new version keeps the entity path
- **WHEN** the user saves the Assets Application as a new version while the iframe is dirty
- **THEN** the entity save for that version runs and no `TRIGGER_SAVE` is sent

#### Scenario: Save succeeds
- **WHEN** the iframe posts `SAVE_SUCCESS`
- **THEN** the dirty state is cleared at once, the success notification used for entity save is shown, the entity is refreshed and Save is enabled again as dictated by the dirty state

#### Scenario: Save fails with nested error
- **WHEN** the iframe posts `SAVE_ERROR` with `payload.error`
- **THEN** an error notification shows that text, the Save and Discard controls stay visible and Save is enabled again

#### Scenario: Save fails with flat error
- **WHEN** the iframe posts `SAVE_ERROR` without `payload.error` but with a top-level `error`
- **THEN** an error notification shows the top-level text

#### Scenario: Save fails without a message
- **WHEN** the iframe posts `SAVE_ERROR` carrying no error text
- **THEN** an error notification shows a generic message

#### Scenario: Save never answers
- **WHEN** no `SAVE_SUCCESS` or `SAVE_ERROR` arrives within the pending-save timeout
- **THEN** the generic error notification is shown, the controls stay visible and Save is enabled again

### Requirement: Header Discard resets the iframe
When the Parameters tab shows a dirty bare-protocol iframe, activating the header Discard SHALL send `RESET`
to the iframe instead of the entity discard.

#### Scenario: Discard sent
- **WHEN** the user activates header Discard while the iframe is dirty
- **THEN** a `RESET` message is posted to the iframe

#### Scenario: Reset confirmed
- **WHEN** the iframe then posts `DIRTY_STATE` with `isDirty` false
- **THEN** the header's Save and Discard are hidden

### Requirement: Leaving the Parameters tab waits for the iframe save result
The view SHALL, for a bare-protocol iframe, send `TRIGGER_SAVE` when the user confirms saving before leaving the Parameters tab, and switch tabs only after `SAVE_SUCCESS`. On `SAVE_ERROR` or timeout it SHALL stay on the Parameters tab. For a legacy iframe it SHALL keep the existing request and wait. A dirty bare-protocol iframe SHALL count as unsaved changes when leaving the tab.

#### Scenario: Save then switch succeeds
- **WHEN** the user confirms saving and the iframe posts `SAVE_SUCCESS`
- **THEN** the view switches to the requested tab

#### Scenario: Save then switch fails
- **WHEN** the user confirms saving and the iframe posts `SAVE_ERROR`
- **THEN** the view stays on the Parameters tab and shows the error notification

#### Scenario: Dirty iframe blocks silent leave
- **WHEN** the user switches away from the Parameters tab while the bare-protocol iframe is dirty
- **THEN** the unsaved-parameters confirmation is shown

#### Scenario: Legacy iframe save then switch
- **WHEN** the user confirms saving and the iframe is legacy
- **THEN** the legacy save request is sent and the tab switches after the existing wait

### Requirement: Unhandled bare messages are ignored
`FrameRenderer` SHALL ignore bare message types it does not handle, including `TRIGGER_AUTO_SAVE`,
`AUTO_SAVE_COMPLETE`, `HEIGHT_CHANGE` and the toolset/credentials requests, without error.

#### Scenario: Auto-save completion arrives
- **WHEN** the iframe posts `AUTO_SAVE_COMPLETE`
- **THEN** no dirty, saving or notification state changes
