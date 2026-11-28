---
title: Command Sourcing vs Event Sourcing
description: Log the request, or log the result? Command sourcing and event sourcing differ in one place, and that one place decides what breaks when your code changes.
date: 2026-11-26
tags:
  - architecture
  - eventsourcing
  - haskell
  - database
devToUrl: https://dev.to/rinn7e/command-sourcing-vs-event-sourcing-12i6
---

**Command sourcing logs the accepted request and works out its result again on every replay. Event sourcing logs the result and only applies it.** That is the whole difference, and it decides what breaks when your code changes.

In a typical CRUD backend you `UPDATE` the row, and the old value is gone. Both patterns keep every change in an append-only log instead, and treat the tables as something you can drop and rebuild from it. You have probably run command sourcing already without the name: Redis with its append-only file (AOF) turned on writes every write command to that file, and replays it after a crash.

I built an app on a log of commands, and everyone who saw it said "so, event sourcing". It is not, and the difference matters more than the name. Almost nothing is written about command sourcing, so here is what I learned: how the two compare, where each one hurts, and how to fix it. The short answer is the table near the end.

## Every app is a state machine

Strip any app down and you get the same loop. Here it is for a note-taking app:

* **State**: the notes, each one a private draft or published.
* **Command**: a request to change it, `PublishNote n1`.
* **`check`**: the rules that can refuse. Does `n1` exist, does it belong to Alice, is it still a draft, is it still the version her screen showed? It runs once, when the request comes in, against the state the user saw.
* **`decide`**: the rules that work out what changes, for a request `check` accepted: an **event**, `NotePublished n1`. It never refuses.
* **`apply`**: writes the event into the state. No rules, no checks, it only writes.
* The next command is decided against the new state.

![Every app is a state machine](/blog/command-sourcing-vs-event-sourcing/state-machine.svg)

In code, it is three functions:

```haskell
-- Once, when the request comes in: is it allowed?
check :: State -> Command -> Either Rejection Command

-- Every run, replay included: what changes? It never refuses.
decide :: State -> Command -> [Event]

-- No rules: write the change into the state
apply :: State -> Event -> State
```

To survive a restart, you write something to a log and rebuild the state from it. A request `check` refuses is never logged. After it, there are exactly two places in this loop to cut: before `decide`, or after it.

```haskell
-- Command sourcing: log the accepted commands, work out their result
-- again on replay. `check` ran when each one came in, so replay never
-- refuses.
replayCommands :: [Command] -> State
replayCommands = foldl step initialState
  where
    step state command = foldl apply state (decide state command)

-- Event sourcing: log the events, only apply them on replay
replayEvents :: [Event] -> State
replayEvents = foldl apply initialState
```

Everything else in this post follows from where you cut.

## Log the request, or log the result

![Two ways to keep the log](/blog/command-sourcing-vs-event-sourcing/two-logs.svg)

Alice publishes a note. First `check` runs, against the state her screen showed: does `n1` belong to her, is it still a draft, is it still at version 3 (so a stale click gets refused)? Only then does command sourcing store the request:

```json
{ "type": "PublishNote", "actor": "alice", "noteId": "n1" }
```

On replay, `decide` runs again and works out what changes. The checks do not run again: the request was accepted when it was logged, and replay is history, not a new click.

Why would a request that is not allowed reach the backend at all? Because the app cannot know for sure:

* **The screen is stale.** Alice published `n1` from her phone, or someone edited it in another tab, after her screen loaded.
* **Two requests race.** Two clicks arrive at almost the same moment, and only the first one can win.
* **The client cannot be trusted.** Anyone can call the API directly, with a changed app or a script.

The app can hide a button it already knows is useless, but only the backend sees the real state, so `check` is the real gate. A refused request gets an error back ("this note changed, reload it") and is never logged.

Event sourcing stores the result:

```json
{ "type": "NotePublished", "noteId": "n1", "publishedBy": "alice" }
```

On replay, the event is applied as is. The decision was made once, and it is never made again.

Note that command sourcing still has events: `decide` produces them on every run. They just never hit the disk.

## You already run command sourcing

The name is rare. The pattern is not:

* **Redis AOF** (append-only file): Redis logs every write command and replays the file after a crash.
* **MySQL replication**: statement-based replication ships the SQL statements (commands), row-based ships the changed rows (events). Same trade-off as this post.
* **Raft** (etcd, Consul): a replicated log of commands, applied in the same order on every node. The textbook name is state machine replication.
* **Game replays** and lockstep multiplayer: they record the inputs of the players and simulate the world again.
* **Prevayler** and **LMAX** (a trading exchange): journal every input, run the business logic on objects in RAM, replay the journal on restart.

A naming trap: Fowler calls the LMAX inputs "input events". The name in the log does not decide the pattern. What decides it is whether the rules run again on replay.

## Command sourcing: pros and cons

The good:

* **The log is the intent.** Every accepted request, in order, as the user sent it.
* **Bug fixes reach the past.** Fix `decide`, rebuild, and every old command goes through the fixed code. Log what imports and webhooks hand in as commands too, with the data exactly as it arrived, and a better parser reads all of it again.
* **Less to design.** One log, one `decide`, and no second schema of events next to the commands. The commands, old versions included, are the schema that lives forever.
* **Trivial to test.** Replay a log, compare the state.

The bad:

* **Replay drift.** The big one, see below.
* **`decide` must be deterministic.** Same state and command in, same result out, every time. Reading the clock, making a random id or calling an API inside `decide` breaks replay.
* **The log does not say what happened.** To know the outcome of a command, you run it again.
* **One global order.** Usually one writer, one command at a time. Simple and consistent, and a hard cap on write throughput.

## Event sourcing: pros and cons

The good:

* **History is fixed.** Events are facts. The past stays as it was decided, whatever the code does later.
* **Read models for free.** A projection (a table or index built by folding the events) per screen, per report, per search index, all from the same log.
* **Writes scale.** Each aggregate (a consistency boundary, say one notebook and the notes in it) has its own stream and its own order, so streams are written in parallel.
* **Other services can subscribe.** The event log doubles as an integration feed.

The bad:

* **Event design is hard.** Events are a public schema that lives forever. Naming, granularity and versioning take real care.
* **More moving parts.** Event store, projections, projection checkpoints, often a worker in between.
* **Eventual consistency.** Projections lag. The user saves, the list reloads, and their change is not there yet.
* **The intent gets lost.** `NotePublished` says what happened, not who asked or why, unless you store that too.
* **Wrong decisions are frozen in.** A bug in `apply` or in a projection is fixed by a rebuild, but a wrong decision is stored as a fact. Fixing it means appending correcting events.

## Replay drift: old commands meet new code

This is the first objection you will hear to command sourcing, and it is a fair one.

![Replay drift](/blog/command-sourcing-vs-event-sourcing/replay-drift.svg)

In March, Alice publishes a note with no title. That is allowed. In June you ship a rule: a note needs a title before it is published. Then you rebuild the state from the log.

If replay checked the rules again, her March command would meet the June rule, get refused, and her note would be a private draft again. That is why the rules that refuse live in `check`: it runs once, when a request comes in, and a logged command was already accepted. The June rule refuses new requests, and her March note stays published.

So a new rule never breaks the past. What is left is a change in what `decide` produces, and it comes in two kinds.

**A result that must stay as it was.** Say the March code makes the public address of a note from its title, and in June you change how. Old notes must keep their addresses, or every shared link breaks. Version the command, and keep the old way for the old one:

```haskell
data Command
  = CreateNote NoteId UTCTime Text
  | PublishNoteV1 NoteId -- March: the address is the title in lower case
  | PublishNoteV2 NoteId -- June: the address is the title, transliterated

decide :: State -> Command -> [Event]
decide state = \case
  PublishNoteV1 noteId -> [NotePublished noteId (addressV1 (titleOf state noteId))]
  PublishNoteV2 noteId -> [NotePublished noteId (addressV2 (titleOf state noteId))]
  -- ...
```

The log stores the version (an old record with no version, like the `PublishNote` above, reads as V1), the API only ever creates the newest one, and old records replay with the code of their time.

**A fix that reaches the commands after it.** A fix to one command can change the state that later commands see. Say a parser fix makes an old import create one more note in the notebook of Alice. Her later commands must mean the same thing whatever the notes around them became, so each one carries what she acted on, resolved when she clicked: `PublishNote n1` names its note, never "the third note of the list", and "mark these as read" names every note it marked. Nothing in a command asks the state to look as it did then, so a fix changes only what it fixes, and the replay never stops on it. A command whose note is gone on replay (the fixed import never creates it) changes nothing, and the rebuild report says so.

When do you need a new version?

* A new rule that refuses (stricter, a new limit): **no**. It goes in `check`, which never runs on replay.
* A change in what an existing command produces, that old commands must keep (an address, a price): **yes**.
* A new command: **no**.
* A bug fix that changes what an accepted command produces: **no**. Fixing the past on the next rebuild is the point.
* The parser of imported data: **no**. Reading old data again with better code is the point.

Two more guards:

* **Keep the state somewhere durable.** In a database or a snapshot file, a restart replays only the tail of the log, and drift can only bite on a full rebuild.
* **Check every rebuild.** Rebuild next to the live state and diff the two. Report the first command in the log whose events differ from the last rebuild: that is where the change starts, so you can see whether it is the fix you meant or something further down. Report the commands whose target was gone too. Never skip either silently.

## Replay needs deterministic rules

`decide` must be a pure function: state and command in, events out. No clock, no random, no network.

So do the impure work before the command exists, and put the results into it. The same goes for what the user acted on: turn "these notes" into their ids before the command is logged.

```haskell
-- In the API handler: everything impure happens here, once
createNoteCommand :: Text -> IO Command
createNoteCommand title = do
  noteId <- NoteId <$> UUID.nextRandom -- not generated inside decide
  at <- getCurrentTime -- not read inside decide
  pure (CreateNote noteId at title)
```

The log now holds everything `decide` needs, and every replay sees the same id and the same time. It is the same reason statement-based MySQL replication has trouble with `RAND()`, `UUID()` and `SYSDATE()`, and why it makes `NOW()` safe by writing the time into the log.

Data from other systems follows the same rule. An import or a webhook becomes a command that carries the data exactly as it arrived (`ReceiveImport`), never a fetch inside `decide`. Turning that data into notes is then a decision like any other (which notebook, which id, is it a duplicate), so it runs again on every replay, and a better parser fixes old imports too. LMAX works this way: every input goes into the journal before the business logic sees it, whoever sent it.

## Event sourcing: the usual fixes

* **Lost intent**: store the command id, the user and the time as metadata on each event, or log the command next to its events.
* **Eventual consistency**: make the command wait until the projection has caught up, or return the new version and let the client read "at least version N", or update the read model in the same database transaction as the events.
* **Changing events**: version them, and write upcasters (functions that turn an old event into the current shape when it is read). Add fields rather than change their meaning, and add a new event type rather than reuse an old one.

## How to choose

| If you need | Lean towards |
| --- | --- |
| The past to stay exactly as decided (money, audit) | event sourcing |
| Fixes in the logic to reach old data (parsers, translations) | command sourcing |
| Many read models, other services listening | event sourcing |
| Simple code: one log, no second schema of events | command sourcing |
| Many writes in parallel | event sourcing |
| To replay exactly what users did (games, simulations) | command sourcing |

And you can mix them: commands as the source of truth, and the events your rules produce as the feed for projections and other services. That is roughly what LMAX does.

## Further reading

* Martin Fowler, [The LMAX Architecture](https://www.martinfowler.com/articles/lmax.html)
* Martin Fowler, [Memory Image](https://www.martinfowler.com/bliki/MemoryImage.html)
* Arkency, [Command sourcing: why I am considering it](https://blog.arkency.com/command-sourcing-why-i-am-considering-it/)
* Wikipedia, [System prevalence](https://en.wikipedia.org/wiki/System_prevalence)

I hope to hear from others if they reach the same conclusion. Feel free to ask me anything as well.

Thanks for reading!
