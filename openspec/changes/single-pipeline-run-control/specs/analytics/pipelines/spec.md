## ADDED Requirements

### Requirement: Runtime is read through a second analytics service

Resuming a pipeline its circuit breaker paused, reading which pipelines are paused, reading which ones the
runner has taken on, reading one pipeline's runtime view, and reading and re-running its dead-lettered failures
are served by the **analytics enrichment runner**, a service distinct from the one that holds the pipeline
registry.

Stopping and starting a pipeline is **not** a runner action. The registry's `enabled` flag is a pipeline's
only run control: the runner follows it, holds a disabled pipeline's queued work instead of discarding it, and
works through that work once the pipeline is enabled again. The runner has no pause of its own that an
operator can take, so the console SHALL NOT offer one; the enable/disable control is how a pipeline is
stopped. Its failures
listing is **paged by cursor and counted by the service**: every page carries the number of items the
filter matches and the number of them it would re-run, read in the page's own snapshot, so a caller
never has to count rows to state a total. The console SHALL
reach it at its own configured host and SHALL treat it as a separate upstream throughout: a registry read
that succeeds while the runner is unreachable SHALL still present the pipeline.

Every property of every runner response is named in **snake_case**, the paused listing included. The console
SHALL parse that spelling and SHALL NOT accept the Java property names the paused listing emitted before,
which named the same two facts differently from every other response that reports them.

The runner authorizes **every** endpoint, reads included, on full-admin rights, and offers no
consumer-facing read. The console SHALL therefore issue no request to it for a caller who is not a full
admin, and SHALL present no runtime affordance to such a caller rather than presenting one that would be
refused.

An installation that has not configured the runner's host SHALL behave exactly as one whose runner did not
answer: no runtime affordance is presented, and no error is raised for the absence. Runtime control is an
addition to the console, not a precondition for reading a pipeline. The failures card is a runtime
affordance like the rest: with no host configured it SHALL NOT be presented and no request SHALL be
issued for it.

The runner reports failures in the same envelope the registry does — a status, a stable machine code, a
human-readable message, the path and the method — so a refusal SHALL be surfaced the way a registry refusal
already is, by the service's own message with its request id. Three of its codes name conditions the operator
can act on and SHALL be distinguished from a generic failure:

- the runner has not yet loaded the pipeline list since it started, which resolves by itself shortly;
- the runtime-state database is unavailable, which does not;
- the runner does not hold the pipeline, which is the state the console already states as nothing running it.

#### Scenario: Runtime survives a runner that does not serve the cache listing

- **GIVEN** the runtime service answers the paused listing but refuses the cache listing
- **WHEN** a full admin opens the pipelines listing
- **THEN** an enabled `enrich` pipeline the paused listing does not name is stated as running
- **AND** no row is stated as not running

#### Scenario: No pipeline pause is offered

- **GIVEN** a full admin on the `Runtime` tab of an enabled `enrich` pipeline the runner reports as active
- **WHEN** the tab is presented
- **THEN** no control to pause the pipeline is presented
- **AND** the enable/disable control in the identity row is the control that stops it

#### Scenario: The paused listing is parsed in snake_case

- **GIVEN** the runtime service reports a paused pipeline with its name and lift time in snake_case
- **WHEN** a full admin opens the pipelines listing
- **THEN** that pipeline is stated as paused
- **AND** its lift time is stated wherever a lift time is stated

#### Scenario: A pipeline reads even when the runner is unreachable

- **GIVEN** the runtime service does not answer
- **WHEN** a full admin opens a pipeline's detail view
- **THEN** the pipeline, its facts and its form are presented
- **AND** no runtime status is stated

#### Scenario: No runtime request is issued for a caller who is not a full admin

- **GIVEN** a caller who is not a full admin
- **WHEN** the user opens the pipelines listing and a pipeline's detail view
- **THEN** no request is issued to the runtime service

#### Scenario: An unconfigured runner is not an error

- **GIVEN** no runtime service host is configured
- **WHEN** a full admin opens a pipeline's detail view
- **THEN** no runtime affordance is presented
- **AND** no failures card is presented and no failures request is issued
- **AND** no error notification is raised

#### Scenario: A cold runner is distinguished from a broken one

- **GIVEN** the runner answers that it has not loaded the pipeline list yet
- **WHEN** a full admin attempts to resume a breaker-paused pipeline
- **THEN** the failure states that the service is still starting and that the action can be retried shortly
- **AND** the pipeline is still presented as paused

### Requirement: A breaker pause is stated above the tab strip

While a pipeline is paused, a banner SHALL render between the identity row and the tab strip, stating that
the pipeline is paused, how long it has been paused, that input is still arriving and that the backlog it
builds is worked through on resume. The banner SHALL carry a resume control.

On the detail page the pause SHALL be taken from the pipeline's own **runtime view**, which reports the
pause the runner is enforcing for it. The global paused listing answers the same question for every
pipeline at once and remains what the listing page reads; asking it again for one pipeline the console has
already read a view of would be a second answer to a question already answered, and the two could disagree.

The only pause the runner takes is its dead-letter **circuit breaker**'s, and it lifts itself. The banner
SHALL state that the pause was taken by the service and SHALL state when it lifts. Resuming lifts it early.

The banner SHALL additionally state the reason the service recorded when it took the pause. That reason
names the evidence the breaker tripped on — how many of the last N units of work were dead-lettered — which
is the first thing a reader needs and the one fact the banner cannot derive. It SHALL be presented as the
service worded it and SHALL NOT be re-phrased: the threshold and the window are the service's
configuration, and a console that restated them would be quoting a copy.

The banner SHALL NOT name who paused the pipeline. The runtime service records the origin and the reason it
wrote at the time, and no user identity, so a name in this banner could only be invented.

A disabled pipeline SHALL raise no banner: it is stopped by its declaration, which the header already
states, and the runner reports it as stopped rather than paused. A pipeline the runtime service does not
report as paused SHALL raise no banner, and a pipeline whose runtime could not be read SHALL raise none
either: a banner is a statement that the pipeline is paused, and an unread runtime does not support it.

The banner SHALL be raised on the reported state alone. The runtime view holds the pause's origin, its
start time and its lift time in the runner's memory, so a restart can lose them while the pause itself
survives — and a banner withheld for a missing member withholds the only Resume control on the page with
it. Where the service did not say when the pause began or when it lifts, the banner SHALL state the pause
without that fact rather than not at all.

Resuming SHALL NOT be confirmed: it lifts a pause that would lift itself. While the request is in flight
the control SHALL state that and SHALL NOT be actionable. A success SHALL be reported as a notification
stating that the pipeline was resumed and SHALL re-read the runtime view. A refusal SHALL be reported as an
error notification carrying the service's message and its request id, and SHALL re-read the runtime view
too: the runner refuses a resume when no pause is in force any more — the breaker lifted it in the
meantime — and the page would otherwise keep offering a control for a pause that is gone.

The resume control SHALL NOT be withheld while the `Discard` / `Save` change bar is up: it sends no part of
the document, and an incident is exactly when the form is most likely to be half-edited. It SHALL NOT be
presented to a caller who is not a full admin.

#### Scenario: A breaker pause states when it lifts

- **GIVEN** a pipeline whose runtime view reports it paused by its circuit breaker, with the time it
  resumes
- **WHEN** a full admin opens its detail view
- **THEN** a banner states that the pause was taken by the service
- **AND** it states when the pause lifts by itself
- **AND** it states that input keeps arriving and is worked through on resume
- **AND** it offers a resume control

#### Scenario: A breaker pause states the evidence it tripped on

- **GIVEN** a pipeline whose runtime view reports it paused by its circuit breaker, with a recorded
  reason
- **WHEN** a full admin opens its detail view
- **THEN** the banner presents that reason as the service worded it

#### Scenario: The banner names no author

- **GIVEN** a paused pipeline
- **WHEN** a full admin opens its detail view
- **THEN** the banner attributes the pause to no named user

#### Scenario: A pause the service can no longer describe still offers Resume

- **GIVEN** a pipeline whose runtime view reports it paused and carries neither the pause's origin nor when
  it began
- **WHEN** a full admin opens its detail view
- **THEN** a banner states that the pipeline is paused, without stating how long it has been
- **AND** it offers a resume control

#### Scenario: Resuming takes no confirmation

- **GIVEN** a full admin on a breaker-paused pipeline
- **WHEN** the user activates the resume control
- **THEN** the pipeline is resumed without a confirmation step
- **AND** a notification states that it was resumed
- **AND** the banner is no longer presented, without a reload

#### Scenario: A resume refused because the pause already lifted

- **GIVEN** a breaker-paused pipeline whose pause lifts while the page is open
- **WHEN** a full admin activates the resume control and the service answers that the pipeline is not paused
- **THEN** an error notification carries the service's message and its request id
- **AND** the runtime view is read again and the banner is no longer presented

#### Scenario: Resume is offered while the form has unsaved edits

- **GIVEN** a breaker-paused pipeline with one field edited and the `Discard` / `Save` bar offered
- **WHEN** a full admin looks at the pause banner
- **THEN** the resume control is presented and actionable

#### Scenario: A disabled pipeline raises no banner

- **GIVEN** a pipeline whose `enabled` is false, which the runtime view reports as stopped
- **WHEN** a full admin opens its detail view
- **THEN** no pause banner is presented

#### Scenario: No banner without a read runtime

- **GIVEN** the runtime service did not answer
- **WHEN** a full admin opens a pipeline's detail view
- **THEN** no pause banner is presented

## MODIFIED Requirements

### Requirement: Runtime status is stated beside configuration status

The pipeline detail header states two facts that are commonly confused and are not the same axis: whether
the pipeline is **enabled**, which is its declaration, and what the runner is doing with it, which is its
runtime. The header SHALL state both, the runtime status as a chip beside the enabled badge.

Runtime status SHALL be stated **only for an `enrich` pipeline**, which is the kind the runner drives.
An `aggregate` pipeline is run by the registry service itself, on its own scheduler — it is absent from
the runner's listings by construction, and reading that absence as a fault flagged every healthy rollup
as one nothing was running. For an aggregate pipeline the console SHALL state no runtime status, raise
no warning about one, and offer no resume: the runner's circuit breaker never pauses one.

On the **detail page** the runtime status SHALL be taken from the pipeline's own runtime view, which states
it directly. The service resolves it by the same rules its own status log uses, so the console SHALL state
what it reports rather than deriving a second verdict that could disagree. Six states are stateable, and no
other:

| State | Condition |
| --- | --- |
| `running` | the view reports it active |
| `paused` | the view reports it paused |
| `held` | the view reports it held, waiting on the registry across a contract change |
| `over budget` | the view reports it over its daily spend budget |
| `backpressured` | the view reports it holding back because its queue is full |
| `not running` | the service answers that it does not hold the pipeline, or the view reports it stopped while the registry has it enabled |

A view that reports a pipeline **stopped** while the registry has it enabled is a runner that has not synced
the enable yet: it follows the registry's flag within one sync. That is the second of the two causes the
`not running` warning already states, so the console SHALL state it as `not running` with that same warning
rather than as a state of its own, and SHALL NOT state it as `running`.

A state this console does not recognise SHALL be stated as `running` rather than withheld. The service's
vocabulary grew from two states to five in one release, and a console that blanked the chip on the next
addition would be withholding what it does know — that the runner holds the pipeline and answered for it —
on the strength of one word it has not learned yet.

The three gate states SHALL be stated as the service names them and SHALL NOT be collapsed into `running`
or into `paused`. Each is a pipeline that is enabled, taken on, and not consuming input, and each clears for
a different reason: a held pipeline waits on the registry, an over-budget one on the next UTC day, a
backpressured one on its own queue draining. A console that showed all three as running would be stating the
opposite of what the operator needs to act on.

No runtime state SHALL offer a control that stops the pipeline: the enable/disable control in the identity
row is the only one, whatever the runner reports. Resume SHALL be offered only while the view reports a
pause.

On the **listing**, which asks about every pipeline at once, the runtime status SHALL continue to be derived
from the two listings the runner serves for exactly that purpose — the pipelines it has taken on and the
pipelines it has paused — and SHALL state the three states those two support: `running`, `paused` and
`not running`. The cache listing names stopped pipelines too, each marked as not enabled, so a pipeline
SHALL count as taken on only when the cache lists it **as enabled**; one listed as stopped while the
registry has it enabled SHALL be stated as `not running`, for the same sync-lag reason as on the detail
page. The gate states are per-pipeline facts the listings do not carry, and one view request per
row is not a trade the listing makes.

`running` SHALL mean that the runner has the pipeline and schedules its fires — **not** that rows are
moving through it at this moment. Neither service reports that, and the console SHALL NOT imply it.

The state the registry cannot show is an enabled pipeline the runner has not taken on: it is presented by
the registry exactly like a healthy one, while nothing is driving it — the runner either refused the
declaration as one it cannot execute, or has not synced since it started. The console SHALL state it as a
**warning inside the `Runtime` tab**, in the warning treatment rather than the error one, and SHALL say
both possible causes, since it cannot tell them apart from outside. It SHALL NOT sit above the tab strip:
right after a pipeline is enabled or saved the runner has ordinarily not picked it up yet, so a page-level
alert raised a fault on every enable. The chip beside the name SHALL still state that the pipeline is not
running, and the copy SHALL say that a minute's delay after enabling is normal and that its persisting
means the service cannot execute the declaration.

On the listing the two reads SHALL fail **independently**. The pauses are load-bearing: without them the
console states no runtime at all. The cache listing only adds `not running`, so where it is missing — an
older runner build, a route that answers 404 — the console SHALL keep stating `running` rather than
withholding every runtime affordance because one of two reads failed. It SHALL NOT state `not running` on an
unread cache: that would state a fault on a guess.

The runtime chip SHALL be withheld — not rendered as unknown — when the pipeline is disabled, when the
runtime could not be read, or when the caller is not a full admin. A disabled pipeline has no runtime answer: the runner
is not driving it at all, and stating it as "not running" would read as a fault where there is a
configuration.

A breaker-paused pipeline SHALL still be stated as **enabled**. The breaker leaves the declaration
untouched, and a console that showed it as disabled would send an operator to re-enable something that was
never disabled.

#### Scenario: A running pipeline states both facts

- **GIVEN** an enabled pipeline whose runtime view reports it active
- **WHEN** a full admin opens its detail view
- **THEN** the header states that it is enabled and that it is running

#### Scenario: A paused pipeline is still enabled

- **GIVEN** an enabled pipeline whose runtime view reports it paused
- **WHEN** a full admin opens its detail view
- **THEN** the header states that it is enabled
- **AND** it states that it is paused

#### Scenario: A gated pipeline states the gate rather than running

- **GIVEN** an enabled pipeline whose runtime view reports it over its daily spend budget
- **WHEN** a full admin opens its detail view
- **THEN** the header states that it is over budget
- **AND** it does not state that it is running
- **AND** no pause or resume control is offered

#### Scenario: A state the console does not recognise is stated as running

- **GIVEN** an enabled pipeline whose runtime view reports a state this console does not know
- **WHEN** a full admin opens its detail view
- **THEN** the header states that it is running

#### Scenario: An enabled pipeline the runner still reports stopped is stated as not running

- **GIVEN** a pipeline the registry has just enabled, whose runtime view still reports it stopped
- **WHEN** a full admin opens its detail view
- **THEN** the header states that it is not running
- **AND** a warning on the `Runtime` tab states that the service either cannot execute the declaration or
  has not picked it up yet
- **AND** no pause banner is presented

#### Scenario: The listing does not count a stopped cache entry as running

- **GIVEN** a pipeline the registry has enabled, which the runner's cache lists as not enabled
- **WHEN** a full admin opens the pipelines listing
- **THEN** its runtime cell states that it is not running

#### Scenario: A backpressured pipeline is distinguished from a paused one

- **GIVEN** an enabled pipeline whose runtime view reports it backpressured
- **WHEN** a full admin opens its detail view
- **THEN** the header states that it is backpressured
- **AND** no pause banner is presented

#### Scenario: The listing states the three it can derive

- **GIVEN** the runner reports one pipeline paused and holds a second but not a third
- **WHEN** a full admin opens the pipelines listing
- **THEN** the first is stated as paused, the second as running and the third as not running
- **AND** no runtime view request is issued for any row

#### Scenario: An aggregate pipeline states no runtime status

- **GIVEN** an enabled `aggregate` pipeline, which the registry service runs on its own scheduler
- **WHEN** a full admin opens its detail view
- **THEN** no runtime chip is presented
- **AND** no warning states that nothing is running it
- **AND** no resume control is offered

#### Scenario: An enabled enrichment pipeline the runner has not taken on is flagged

- **GIVEN** an enabled `enrich` pipeline the runtime service answers as one it does not hold
- **WHEN** a full admin opens its detail view
- **THEN** a warning on the `Runtime` tab states that nothing is running the pipeline
- **AND** nothing above the tab strip states it
- **AND** it states that the service either cannot execute the declaration or has not picked it up yet

#### Scenario: A disabled pipeline states no runtime status

- **GIVEN** a pipeline whose `enabled` is false
- **WHEN** a full admin opens its detail view
- **THEN** the header states that it is disabled
- **AND** no runtime chip is presented

#### Scenario: An unread runtime states no runtime status

- **GIVEN** the runtime service did not answer
- **WHEN** a full admin opens an enabled pipeline's detail view
- **THEN** the header states that it is enabled
- **AND** no runtime chip is presented

### Requirement: A runtime view the runner cannot yet answer is distinguished from a pipeline it does not hold

Before any answer has arrived the console SHALL state **nothing** about the runtime: no chip, no empty
state and no notice. A verdict published before the service has answered is wrong however it is worded, and
every statement below is a verdict.

The runtime service answers a view request in three ways the console SHALL tell apart, because each calls
for a different statement and the operator's next move differs:

- it **does not hold the pipeline** — a pipeline absent from a synced cache. This is the state the console
  already states as nothing running the pipeline: the runner either refused the declaration as one it cannot
  execute or has not picked it up since it started. The console SHALL state it as that same warning and
  SHALL NOT state it as a failed read.
- it **has not synced yet** — the runner started and has not loaded the pipeline list. It resolves by itself
  shortly, so the console SHALL state that the runtime is not read yet and that the read can be retried, and
  SHALL NOT raise it as an error or present the pipeline as one nothing is running.
- it **refused or did not answer** — any other failure. The console SHALL state that the runtime could not be
  read, by the service's own message where it carries one, and SHALL state that the pipeline's configuration
  is unaffected.

None of the three SHALL withhold the pipeline, its facts or its form: the registry read stands on its own.

Each of the three SHALL be stated **once**. A console that reported a cold runner, or a pipeline the runner
does not hold, as a failed read as well put two notices on one tab contradicting each other.

A refused read SHALL carry the service's message **and** the statement that the pipeline's configuration is
unaffected. The second is what the reader acts on, and the service's message is never empty, so presenting
one in place of the other made the second unreachable.

None of the three answers offers a resume control, because none reports a pause. The control that stops a
pipeline is the enable/disable control, which reads only the registry, so a runtime read that fails or has
not answered SHALL NOT withhold it.

#### Scenario: A pipeline the runner does not hold is stated as one nothing is running

- **GIVEN** an enabled `enrich` pipeline the runtime service answers as not found
- **WHEN** a full admin opens its detail view
- **THEN** a warning on the `Runtime` tab states that nothing is running the pipeline
- **AND** nothing above the tab strip states it
- **AND** it states that the service either cannot execute the declaration or has not picked it up yet
- **AND** no resume control is offered
- **AND** no error notification is raised

#### Scenario: A runner that has not synced is stated as not read yet

- **GIVEN** the runtime service answers that it has not loaded the pipeline list yet
- **WHEN** a full admin opens an enabled `enrich` pipeline's `Runtime` tab
- **THEN** the tab states that the runtime is not read yet and can be read again shortly
- **AND** it does not state that nothing is running the pipeline
- **AND** no runtime chip is presented

#### Scenario: A refused read states the service's own message

- **GIVEN** the runtime service refuses the view with a message
- **WHEN** a full admin opens an enabled `enrich` pipeline's `Runtime` tab
- **THEN** the tab states that the runtime could not be read, carrying that message
- **AND** it states that the pipeline's configuration is unaffected
- **AND** the pipeline, its facts and its form are presented
- **AND** the enable/disable control is still offered

#### Scenario: Nothing is stated while the read is in flight

- **GIVEN** a full admin opening an enabled `enrich` pipeline whose runtime read has not yet answered
- **WHEN** the `Runtime` tab is presented
- **THEN** no runtime chip is presented
- **AND** the tab states neither that the pipeline has never run nor that its runtime could not be read
- **AND** no resume control is offered

#### Scenario: A cold runner is stated once

- **GIVEN** a runner that has not loaded its pipeline list, and a pipeline for which the registry records
  no state
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** the tab states that the runtime is not read yet
- **AND** it does not also state that the runtime could not be read

### Requirement: A running or paused backfill is stated above the tab strip

While a backfill of the pipeline is running or paused, a banner SHALL render beside the pipeline's pause
banner, above the tab strip, stating the run's state and offering a control that opens the backfill drawer.
For a paused run the banner SHALL state the reason the run reports.

The banner SHALL NOT be shown for a run paused because its pipeline is paused — by the circuit breaker, or by
an operator on a runner older than the one that retired that pause, whose runs still carry the reason: the
pipeline's own banner already states that pause. In every other state of the run the banner SHALL be shown,
including a run paused because its pipeline is **stopped**. A disabled pipeline raises no pause banner of its
own, so this banner is the one place a reader learns that the replay is held, and its reason SHALL say that
the run is held because the pipeline is disabled and continues once it is enabled and resumed.

The banner SHALL be read from the runner's list of runs narrowed to the pipeline, so it is present after a
reload. It SHALL NOT be shown for a run that is done or cancelled.

#### Scenario: A running run

- **GIVEN** a running backfill of the pipeline
- **THEN** the banner states that it is running and opens the drawer

#### Scenario: A run paused for its own reason

- **GIVEN** a backfill paused because the pipeline's spend budget is used up
- **THEN** the banner states that it is paused and gives that reason

#### Scenario: A run paused with its pipeline

- **GIVEN** a backfill paused because its pipeline is paused by the breaker
- **THEN** no backfill banner is shown and the pipeline's pause banner is

#### Scenario: A run held by a stopped pipeline

- **GIVEN** a backfill paused because its pipeline was disabled
- **THEN** the backfill banner is shown
- **AND** it states that the run is held because the pipeline is disabled

#### Scenario: A finished run

- **GIVEN** the latest backfill is done or cancelled
- **THEN** no backfill banner is shown

### Requirement: A run's controls follow its state

The controls SHALL be the first thing in the run block, drawn large, above the run's figures. A running run SHALL
offer Pause and Cancel. A paused run SHALL offer Resume and Cancel, except that **Resume SHALL be withheld while
the pipeline is paused or disabled**: the runner repeats the start checks on a resume and refuses one while its
pipeline is paused or stopped, so the control could only fail. In its place the block SHALL say what must happen
first — that the pipeline is paused and must be resumed, or that it is disabled and must be enabled — and Cancel
SHALL remain, because the runner cancels a paused run whatever state its pipeline is in. The pipeline's pause and
its `enabled` flag SHALL be read as they stand while the drawer is open, so resuming or enabling the pipeline
offers Resume without closing and reopening the drawer. A done or cancelled run SHALL offer no control.

Cancelling SHALL be confirmed, because it cannot be undone and abandons the run's cursor. Pausing and resuming
SHALL NOT be confirmed. The console SHALL NOT warn before resuming a run on account of its pause reason. When the
service refuses a verb the console SHALL show the service's own message and read the run again — including a
resume the console had no way to foresee being refused, such as one over a spent daily budget, or one on a
pipeline the runner still holds as stopped because it has not synced the enable.

#### Scenario: Controls by state

- **GIVEN** a running run
- **THEN** it offers Pause and Cancel
- **AND GIVEN** a paused run on an enabled pipeline that is not paused
- **THEN** it offers Resume and Cancel

#### Scenario: The controls come first

- **GIVEN** a running run
- **THEN** Pause and Cancel are the first controls in the run block

#### Scenario: A finished run has no controls

- **GIVEN** a done or cancelled run
- **THEN** it offers no control

#### Scenario: Resume is withheld while the pipeline is paused

- **GIVEN** a paused run and a paused pipeline, whatever the run's pause reason
- **THEN** the block offers no Resume, says the pipeline is paused and must be resumed first, and still offers Cancel

#### Scenario: Resume is withheld while the pipeline is disabled

- **GIVEN** a paused run on a pipeline whose `enabled` is false
- **THEN** the block offers no Resume, says the pipeline is disabled and must be enabled first, and still offers
  Cancel

#### Scenario: Resume returns when the pipeline is resumed

- **GIVEN** the drawer open on a paused run while its pipeline is paused
- **WHEN** the pipeline is resumed
- **THEN** the run offers Resume without the drawer being reopened

#### Scenario: Resume returns when the pipeline is enabled

- **GIVEN** the drawer open on a paused run while its pipeline is disabled
- **WHEN** the pipeline is enabled
- **THEN** the run offers Resume without the drawer being reopened

#### Scenario: Cancel is confirmed

- **WHEN** the reader chooses Cancel
- **THEN** the console asks for confirmation before it cancels

#### Scenario: A refused resume the console could not foresee

- **GIVEN** a paused run on an enabled pipeline that is not paused, whose resume the service refuses with a
  conflict
- **THEN** the console shows the service's message

#### Scenario: A run that has changed state

- **GIVEN** a run that finished while the drawer was open
- **WHEN** the reader pauses it and the service refuses
- **THEN** the console shows the service's message and reads the run again

### Requirement: A refused start reports the service's message

When the runner refuses to start a backfill the console SHALL show the runner's own message and leave the
form as it was. This covers a pipeline the runner does not hold, a pipeline that is paused, stopped or over its
daily spend budget, a run already running, an invalid window, and a runner whose pipeline list has not loaded
yet. The console SHALL NOT present a start on a paused or stopped pipeline as accepted.

While the pipeline is **disabled** the start form SHALL NOT offer to start a run: the runner refuses every start
on a stopped pipeline, so the control could only fail. In its place the form SHALL say that the pipeline is
disabled and must be enabled first. The form SHALL follow the pipeline's `enabled` flag while the drawer is
open. The latest runs and a current run's Cancel SHALL stay available.

#### Scenario: A paused pipeline

- **GIVEN** the runner refuses a start because the pipeline is paused
- **THEN** the console shows its message

#### Scenario: A pipeline the runner does not hold

- **GIVEN** the runner answers that the pipeline is not found or not enabled
- **THEN** the console shows its message

#### Scenario: A disabled pipeline offers no start

- **GIVEN** a full admin opens the backfill drawer of a pipeline whose `enabled` is false
- **THEN** the start form offers no control that starts a run
- **AND** it says that the pipeline is disabled and must be enabled first
- **AND** the latest runs are still listed

#### Scenario: A start refused because the runner has not synced the enable

- **GIVEN** a pipeline enabled moments ago, which the runner still holds as stopped
- **WHEN** a full admin starts a backfill and the runner refuses it with a conflict
- **THEN** the console shows the runner's message and leaves the form as it was

## REMOVED Requirements

### Requirement: A pipeline's enqueue can be paused and resumed

**Reason**: The enrichment runner no longer has an operator pause; the registry's `enabled` flag is a
pipeline's only run control (epam/ai-dial-analytics#36, epam/ai-dial-analytics-enrichment-runner#5).
**Migration**: Stop a pipeline with the enable/disable control. Resuming a breaker pause moves to "A breaker
pause is stated above the tab strip".

### Requirement: Runtime control is reached through a second analytics service

**Reason**: It described pausing a pipeline in the runner, which the runner no longer offers.
**Migration**: Replaced by "Runtime is read through a second analytics service", which keeps every other
runner read and states that `enabled` is a pipeline's only run control.

### Requirement: A paused pipeline states its pause above the tab strip

**Reason**: Its operator-pause branch describes a pause the runner no longer takes.
**Migration**: Replaced by "A breaker pause is stated above the tab strip", which also owns the resume control.
