## Context

The service refuses a rename or a drop of a source column that is the grain key of an enrichment: the enrichment joins on the shared column name and its half of that name is its ordering key, which cannot be renamed. The detail page already locks the columns the service refuses for its own keys (grain key, ordering key, partition column, system columns) from the table's own definition. This one depends on other tables, so the page has to look beyond its own definition.

## Decisions

### D1. Derive the locked columns from the listing and the enrichments' own definitions

The listing names each enrichment's source table but omits its grain key, which only the enrichment's own definition carries. The grain key equals the source column's source name — the same match the page already uses to resolve an enrichment's own grain-key row. The page reads the listing, reads the definition of each enrichment built on this table, and builds a map from source name to the enrichment that keys on it. An enrichment whose definition cannot be read adds nothing to the map.

- **Alternative: a dedicated endpoint for a table's dependents.** Rejected: the two reads already answer the question, and a new service contract would delay a fix the page can make today.
- **Alternative: read the grain key from the listing.** Not possible: the listing omits it.
- **Alternative: let the save fail and show the service's message.** Rejected: that is today's behaviour and the reason for the report.

### D2. Lock both operations the service refuses, nothing else

The service applies one rule to rename and drop together, so both are locked together: the Name field, the inline name edit and the drop action. Inline rename is locked for these columns only: the other rename-locked columns keep their current inline behaviour, which is outside this change. Display name, tag, description and sensitivity are not part of that rule and stay editable.

### D3. Only an `ACTIVE` source table is read

An enrichment exists only against a materialized source, and an enrichment page has no enrichments of its own. The listing is not requested for a draft or for an enrichment.

### D4. A failed read locks nothing

The lock is a courtesy over the service's rule, not the rule. If the listing cannot be read, or an enrichment's definition cannot, the page behaves as it does today and the service's rejection remains the source of truth. No notification is raised for the failed read: the page is usable and the user asked for nothing that failed.

### D5. One enrichment named in the note

Several enrichments may key on the same column; the service names one. The note names the first by listing order and says the enrichment must be dropped, which holds for each.

### D6. The reason sits beside the field

A disabled field with no explanation is what the report is about. The edit modal shows the reason as the Name field's own hint, in the field's place, rather than as a tooltip that keyboard users cannot reach.

## Risks

- A listing the caller cannot read in full, for lack of access to an enrichment, hides that enrichment from the map; that column then stays unlocked and the service's rejection still applies (D4).
