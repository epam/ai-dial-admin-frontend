## Context

The role drawer decides whether a row limit is storable from the row-limit editor's completeness flag, which comes from a check for conditions that serialize to nothing. The roles table derives each row's Rows cell from the stored row policies and the Read list. The drawer renders the "already holds" banners itself, one per reported grant.

## Decisions

### D1. A blank literal value is an unfinished condition

A condition compared with an empty literal serializes without complaint, so the completeness check never sees it as unfinished, and a role is stored with a filter that matches no row. The check now also treats a literal right operand that is blank — and an **is one of** list with no non-blank item — as unfinished. A null comparison is not a literal and stays complete.

A row limit that means "equals the empty string" can no longer be saved. It is indistinguishable from a forgotten value, and a limit that silently matches nothing is the failure the report describes, so the limit is not offered.

### D2. A policy without Read is marked as kept, not hidden

A row policy applies to its role by whatever path the role reads the table, including grants the service holds globally, which this page cannot see. Hiding the policy would show a role as unrestricted when it is not; showing it as the role's read scope would suggest a read right the table's own grants do not give. The Rows cell therefore states both facts: the role cannot read rows through this table's grants, and its filter is kept.

The cell kind now means what the role reads through this table: it is **None** for a role without Read, whether or not it has a policy. Whether a policy is stored is read from the row's filter, which is present exactly when the policy is, so the cell, the **Rows limited** filter and the removal dialog read the policy from the filter rather than from the kind.

- **Alternative: a new cell kind for "policy kept".** Rejected: the filter already says whether a policy is stored, so a new kind would repeat it.
- **Alternative: hide the policy when Read is off.** Rejected for the reason above.

The removal dialog keeps listing the row limit of such a role, because removing the role deletes that policy.

### D3. Banners share one stack

The Read banner lived inside its card because Read was the only entry the original design placed beside a card. The other entries are stacked below the cards, so the Read entry joins them. The card no longer takes children, and the unused prop is removed.

## Risks

- A policy kept without Read is still stored on the service, so a later grant of Read re-activates it; the note says the filter is kept, which states that without promising either outcome.
