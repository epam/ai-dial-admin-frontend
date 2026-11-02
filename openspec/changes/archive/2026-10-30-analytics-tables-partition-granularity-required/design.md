## Context

`buildDraftSchemaDto` writes `partition_by` only when both the partition column and a granularity are set, and the
granularity select offers a "None" choice equal to the empty default, so a partition column with no granularity is
dropped from the request silently.

## Decisions

### D1. As the scan-metadata pair does

The form hook derives `isGranularityMissing` (a source with a partition column and no granularity) and includes it
in `canMaterialize`; the select receives the message and the invalid state the way the Identity and Version selects
do. No default is chosen for the author.

*Alternative:* preselect month when a partition column is picked. Rejected: it is the author's decision, and the
required marker states it plainly.

### D2. The "None" choice is removed from the granularity options

"None" meant "no partition", which the Partition column field already expresses with its own "None". The options
constant loses that entry.

## Risks / Trade-offs

- **A table seeded from a stored definition always has a granularity**, so the new rule cannot block a retry of a
  failed table.
