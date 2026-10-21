## ADDED Requirements

### Requirement: A trace can be opened outside a session, with a span preselected

The trace view SHALL be openable from a surface that has no session — the entity Audit `Traces` tab — and
SHALL then state the same trace: the same span tree, span panel and Request, Response and Chat tabs, read by
the trace and the span exactly as they are when the trace is opened from a session.

No read the trace view makes SHALL depend on a session being present. Every read it makes is located by the
trace and the span already; a session present or absent SHALL NOT change what a read returns.

Where the opening surface names a span, the trace view SHALL open with that span selected: selected in the
tree, its ancestors expanded so it is visible, scrolled into view, and its details shown in the span panel.
Where the named span is not among the spans the trace read returned, the trace view SHALL open on the
trace's entry hop, as it does when no span is named, rather than failing.

#### Scenario: A trace opened from an entity reads the same as from a session

- **GIVEN** a trace that is reachable both from a session and from a model's Audit `Traces` tab
- **WHEN** the user opens it from each and selects the same span
- **THEN** the tree, the span panel and the Request, Response and Chat tabs state the same content

#### Scenario: A named span is selected on open

- **GIVEN** the opening surface names a span nested three levels deep
- **WHEN** the trace view opens
- **THEN** that span is selected, its ancestors are expanded, it is scrolled into view, and its details are
  shown

#### Scenario: A named span the read did not return

- **GIVEN** the opening surface names a span the trace read did not return
- **WHEN** the trace view opens
- **THEN** it opens with the trace's entry hop selected, as it does when no span is named
