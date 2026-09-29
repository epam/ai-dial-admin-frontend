## Decisions

### Labels name themselves; no prefix

The prefix only reached the closed trigger, and the open list is where the choice is made. Labels that
each carry "Nulls" read correctly in the list, the trigger and the summary alike, so the prefix became
redundant ("Nulls: Nulls first"). The user picked this over keeping short labels behind the prefix.

### Describe the default by the engine's behaviour

"Default" serializes as no `nulls`, and the service then emits no NULLS clause, so placement is the
engine's: nulls sort high — last ascending, first descending. The service asserts the ascending half in
an integration test; the descending half was confirmed against the running service.

### Summary shows only a non-default placement

Most sort keys keep the default; naming it on every collapsed row would add noise without information.
