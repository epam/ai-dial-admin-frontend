## Purpose

Defines what the audit detail page's **shared** revision diff renders when a comparison produces
nothing — the surface `EntityDiff`
(`apps/ai-dial-admin/src/components/ActivityAudit/View/DiffReport/EntityDiff.tsx`) owns for every
resource type the audit page can open: admin, deployment-manager and analytics alike. It is
deliberately resource-type agnostic: the gap it closes is structural to the shared diff engine, not
specific to one backend's snapshots.

Related, and not restated here: `activity-audit-analytics-view`'s *Analytics snapshots are resolved
per resource type* owns how an analytics snapshot is fetched and what happens when the backend
answers one side as absent; `activity-audit-deployments-detail` owns the deployment-manager sections.
This capability owns only the empty case and the legend that labels a diff.

## ADDED Requirements

### Requirement: The revision diff states when a comparison has nothing to show

The audit detail page renders a revision comparison as one section per populated diff bucket. When a
comparison produces **no section at all**, the page SHALL render an explicit empty state in place of
the diff body rather than rendering nothing, and SHALL NOT render the Create / Update / Delete legend
that labels a diff — there is nothing left for it to label.

The condition SHALL be evaluated on the set of sections the body renders, and SHALL NOT be gated on
the activity's resource type. A snapshot the backend answers as absent on **both** sides of the
comparison is the observed case — the analytics backend answers `404 revision_not_found` for a
resource whose creation predates its audit trail, and the deployment-manager backend's own snapshot
contract documents the same `404` for a deployment or image definition that did not exist at the
requested revision — but the requirement is keyed on the empty comparison, not on how it came to be
empty.

The empty state SHALL carry a localized title, `ActivityAudit.SnapshotUnavailableTitle`, and the title
SHALL be the whole of the copy — no second line of explanatory text is rendered beneath it. The title
states, as a fact about the audit trail's coverage, that no snapshot is recorded for this revision. It
SHALL NOT read as a failure: no error page, no error notification, and no vocabulary implying that
something went wrong or that the viewer caused it. This is the same non-blaming treatment *Analytics
snapshots are resolved per resource type* already requires of a one-sided missing snapshot; nothing
about that requirement changes.

The empty state SHALL be exposed as a status region, so that switching the `Comparison` control from
a populated comparison into an empty one is announced rather than being a silent disappearance, and
so the state is addressable by role.

**One message, not two.** Whether the snapshot was never recorded or was recorded and is empty SHALL
NOT be distinguished in the copy: the API client maps a `404`, every other non-2xx, a network failure
and a body that is not JSON to the same absent value, so no layer that renders can tell those cases
apart, and no code path produces a fetched-but-empty snapshot. A second message SHALL NOT be
invented for a condition the code cannot detect. Because only one of the two conditions is reachable,
the single title is unambiguous on its own: it names the absence of a recorded snapshot, which is not
what a copy for *this revision is empty* would say.

**Boundary.** The empty state SHALL be keyed on the comparison producing no section at all — not on
the active `All parameters` / `Changes only` filter hiding every row of the sections it does produce.
A filter the viewer chose and can undo is not a missing snapshot, and the message above would be
false for it; that case SHALL keep rendering exactly as it does today.

#### Scenario: A comparison with no snapshot on either side shows an empty state

- **GIVEN** an activity whose snapshot the backend answers as absent both for the activity's own
  revision and for the revision before it
- **WHEN** the user opens its detail page
- **THEN** an empty state is rendered in place of the diff body, titled from
  `ActivityAudit.SnapshotUnavailableTitle`
- **AND** that title is the only copy the empty state carries — no explanatory sentence is rendered
  beneath it
- **AND** it is exposed as a status region, addressable by role, and that title is the text the region
  carries
- **AND** no error page and no error notification is shown
- **AND** the behaviour does not depend on the activity's resource type

#### Scenario: The legend is not rendered when the diff has nothing to label

- **WHEN** the user opens the detail page of an activity whose comparison produces no section
- **THEN** the Create / Update / Delete legend is not rendered beneath the diff body

#### Scenario: A comparison that produces at least one section is unchanged

- **GIVEN** an activity whose comparison produces at least one populated section
- **WHEN** the user opens its detail page
- **THEN** that section is rendered as it is today
- **AND** the Create / Update / Delete legend is rendered
- **AND** no empty state is rendered

#### Scenario: A filter that hides every row does not produce the empty state

- **GIVEN** the detail page of an activity whose comparison produces at least one section in which no
  row is marked as added, removed or changed
- **WHEN** the user selects `Changes only`
- **THEN** no empty state is rendered
- **AND** the Create / Update / Delete legend is still rendered
