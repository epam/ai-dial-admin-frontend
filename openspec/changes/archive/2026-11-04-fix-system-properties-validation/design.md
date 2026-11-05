## Context

System Properties owns the whole settings draft and saves it from any tab. Schedule validation currently belongs to a conditionally mounted child; spending validation already belongs to the page. Reset clears context registrations after a successful save.

## Decisions

- Register both field validities at page level, re-registering after a context reset and removing registrations on page unmount. Reuse `isRateLimitScheduleValid`; preserve absent-field defaults.
- Share the existing nonblank cost-object rule between page and tab through a feature-local pure function.
- Use the existing tab error status and accessible status label rather than navigating automatically.
- Catch only rejected update requests and use the existing localized generic error notification. Preserve response-envelope handling, edits and refresh behavior.
- Fold the missing archived Spending Limits delta into the consolidated spec without altering the archive.

## Non-goals

No new cost-object format restrictions, API changes, or automatic navigation.
