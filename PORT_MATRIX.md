# Dot to Dot — Port Matrix

Every behaviour in the legacy Supabase PWA (`jfb/jfb-dot-to-dot`) set against the Pivotly native app
(`jfb/jfb-dot-to-dot-native-app`). The two write to different backends — `daily_events` via Supabase
versus `jfb_daily_activities` via `core-data-write` — so what ports is **the rule, not the query**.

| Status | Count | Meaning |
|---|---|---|
| `MISSING` | 6 | Not in the native app at all |
| `DIFFERS` | 10 | Present but behaves differently |
| `PARITY` | 19 | Equivalent already, nothing to do |
| `AHEAD` | 4 | Native is better; nothing to port |
| `ARCH` | 2 | Architectural difference, needs a decision |
| **Total** | **41** | |

---

## Open work, easiest first

`XS` is minutes in one file · `S` is under an hour · `M` is a real change across a few files ·
`L` is blocked — on a decision, a schema change, or a capability the app does not have yet.

| # | Effort | Feature | Legacy PWA | Native app | Status | What to do |
|---|---|---|---|---|---|---|
| 1 | `XS` | Build version badge | Corner pill showing the running build so the field can confirm what an iPad is on | None | `MISSING` | Trivial, pays for itself the first time someone reports a fixed bug |
| 2 | `XS` | Delete a session | Confirm dialog, removes from IndexedDB — but not from Supabase. The toast says "Session deleted", which overstates it | Removes from React state **and** the IndexedDB `sessions` store; the platform row is left alone, same as the PWA. The toast says "Session removed from this device — the synced record is unchanged" | `DIFFERS` | Only the confirm dialog is missing now. Whether delete should void the server record is a product question that applies to both apps — moved to the decisions below |
| 3 | `S` | Settings modal | Project name/code/client/dredge fields, plus Clear 48hr and Clear All for the device log | None | `MISSING` | Mostly legacy — project fields come from the backend now. Only the clear actions are worth porting |
| 4 | `S` | Change operator mid-shift | Ends the running session, picks a new operator, returns straight to the grid. Has a Cancel | Re-enters the operator step then walks the shift-start screen again | `DIFFERS` | Port the fast swap — it also removes the reason the shift-start screen is re-entrant |
| 5 | `S` | Reset for the next shift | Clears `shiftStartDate`, returns to confirm screen. Log is date-grouped so carry-over is intentional | Steps to `confirmSetup` but never clears `sessions` — a second shift inherits the first's list and running total, and since rows now persist that carry-over survives a reload too | `DIFFERS` | Clear on new shift, but distinguish that from Change Operator, which re-enters the same screen |
| 6 | `S` | Write-behind queue | Attempts counted per item; 10 failures mark it `failed` so it stops burning retries and surfaces | Drains every 30s and on `online`, but retries forever — no attempt cap, no failed state | `DIFFERS` | Port the attempt counter and terminal failed state |
| 7 | `S` | Sync status UI | Corner pill: syncing count / sync issue / synced then auto-hides. Surfaces the failed state | Header button + modal listing each pending item with queue timestamps and manual Retry, plus a toast announcing how many synced whenever a drain actually clears something | `DIFFERS` | Native is richer but can't show failures — add the failed state to it |
| 8 | `M` | **Multi-layer gate** | `isMultiLayerProject()` requires capping **and** >1 layer; comment calls the capping test load-bearing | `projectsViewModel.js:42` checks only `layers.length > 1` | `DIFFERS` | **Do the three work-type rows together.** **Bug.** Add the capping condition — otherwise Torch Lake's dredge operator writes `layer_id` with a null `pass_number` |
| 9 | `M` | **Delay codes filtered by work type** | `getDelayCodes(workType)`; null-work_type codes always show. Comment: Torch Lake would otherwise show ~91 tiles | No filter — every active project code renders. `buildProjects` doesn't even carry `work_type` onto the mapped code, so there is nothing to filter on yet | `MISSING` | **Do the three work-type rows together.** **Corruption risk.** A placement event can be tagged with a dredging code, breaking cross-project `delay_code_num` rollups. Add `work_type` to the delay-code map in `buildProjects`, then filter on `null` OR the machine's work type |
| 10 | `M` | Pass / Lift / Layer field | Three modes: pass types (dredging), fixed Lift 1–8 (capping), named layers (multi-layer), label switches | Two modes only — capping projects get pass types where they should get lifts | `DIFFERS` | **Do the three work-type rows together.** Add the Lift 1–8 branch and label switch |
| 11 | `M` | Session log | Grouped by date, per-day totals, Today/Yesterday headers, read from IndexedDB so it survives reload | Rows now persist to a `sessions` store (IndexedDB v2) and today's are reloaded on boot, so a resume shows the morning's work and gap anchoring stays correct. Still a flat single-day list — no date grouping, no per-day totals, and still not cleared between shifts on the same day | `DIFFERS` | Persistence done. Remaining: group by date with Today/Yesterday headers, and prune or bound history — rows accumulate with no equivalent of the PWA's Clear 48hr / Clear All |
| 12 | `M` | Headless test harness | `scripts/test-equipment-phase.mjs` runs the real class in a VM to assert work-type branching without a browser or Supabase | No tests of any kind | `MISSING` | Port early — every work-type rule above is exactly what it covers |
| 13 | `L` | Legacy category values on read | `isActiveCategory()` treats `ACTIVE DREDGING`, `ACTIVE PLACEMENT` **and** legacy `ACTIVE CAPPING` as productive; `displayCategory()` remaps a stored value to the current label before rendering. (Note: `activeCategory()` and `activeLabel()` are separate functions but return identical values today — the write/display split is nominal) | Neither exists; `s.category` renders raw. **Not reachable today** — nothing reads `jfb_daily_activities` back, so every row in the list was written by `activityLabel()`, which emits only `ACTIVE DREDGING` or `ACTIVE PLACEMENT` | `DIFFERS` | Defer until the app reads history back. And **do not port `displayCategory` verbatim** — it remaps a stored category to the *current* machine's label, so changing equipment mid-shift would relabel the morning's dredging rows as placement. Rendering raw is more truthful. When history is read back, port `isActiveCategory` for colour only |
| 14 | `L` | **Duplicate protection on retry** | Every row carries `local_id`, upserted `onConflict: 'local_id'` — re-sending is harmless | `core-data-write` sends `operation: 'insert'`. A `local_id` *is* generated in `saveDailyActivity` but only as the IndexedDB queue key — it never enters `recordData`, so nothing reaches the server to dedupe on. A write that succeeded but whose response was lost is re-sent by the drain and lands twice | `MISSING` | **Most consequential gap in this table.** The key already exists client-side; put it in the payload and give the backend something to key on |
| 15 | `L` | **Lane / Step prompt** | `usesLaneStep()` = `isCapping && isHydraulic`. Comment records any-capping was wrong and had Weigand's mechanical operator answering it for months | Hardcoded false via empty `PROJECT_EXTRAS_BY_NAME`; modal unreachable. Lane/step are display-only, never in the write payload | `MISSING` | Derive from work type, then give the fields somewhere to land in the schema |
| 16 | `L` | Operator picker | Initials avatar, plus free-text fallback when the roster is empty. The typed name persists — `daily_events.operator_name` is a text column | Initials avatar and free-text fallback both ported, so the empty-roster dead-end is gone. But `jfb_daily_activities` has only `operator_id` (uuid FK) and no name column, so a typed name is device-local: it shows in the header and session log while the rows save with `operator_id` null. The picker says so on screen rather than letting it look saved | `DIFFERS` | Frontend done. Closing it properly needs `operator_name` text on `jfb_daily_activities` — schema, not frontend (see below) |
| 17 | `L` | Cold-start offline | Service worker, network-first with cache fallback, installable to home screen. Works from a dead start with no network | No service worker — boots off a `postMessage` handshake with the Pivotly portal frame | `ARCH` | **Decide deliberately.** An iPad that reboots out of signal cannot open the native app at all |
| 18 | `n/a` | Back-button trap | `popstate` re-push so Android back dismisses an overlay instead of leaving the app | N/A — runs in an iframe, react-router removed | `ARCH` | — |

**A rewind rule had to change for #2.** `confirmShiftStart` used to treat *any* start time in the future as
"this is a night shift that began yesterday" and subtract a day. That was harmless while the stepper only
ever showed the current time. Once it pre-fills yesterday's start, an operator opening the app at 05:30 with
a 06:00 start would have confirmed a shift beginning 06:00 **yesterday** — a 23-hour shift, with the gap
logic believing it. It now only rewinds when the time is more than six hours ahead, so a 22:00 start seen at
01:00 still rewinds and an early login does not. The PWA has both the same pre-fill and the same rewind
rule, so this is live on the iPads today.

**The three work-type rows share one blocker** — multi-layer gate, delay-code filtering, and Lift 1–8. The PWA resolves work type at render time from the selected machine (`effectiveWorkType()` reads the equipment row); the native app resolves it in `buildProjects`, which runs per project *before* any equipment is picked. Fix that once and all three become one-line conditions — attempt them separately and you pay for the same refactor three times.

## Already at parity

Kept for the comparison — nothing to do.

| # | Effort | Feature | Legacy PWA | Native app | Status | What to do |
|---|---|---|---|---|---|---|
| 1 | `—` | Interrupted-session recovery | Overlay with activity badge, start time **and day**, elapsed, and an area/pass summary line | Same. Shows `Started 06:15 on Sun, Sep 14` plus an area/pass context line built from the snapshot's `areaL1/L2/L3` and `pass` — which already carries the layer name on multi-layer projects, so the PWA's `layerName || pass` collapses to one field here | `PARITY` | **Done.** Day is always shown, as in the PWA — on a recovery screen two signals that a session is from yesterday beat one |
| 2 | `—` | Startup/shutdown row colour | Gap rows carry no `delayCategory`, so `getSessionColor` falls through to a dedicated slate grey `#708090` — auto-logged time is visually distinct from every delay code | Same. `sessionColor()` returns `COLORS.startupShutdown` (`#708090`) for gap rows before falling through to the group lookup, and the two magic strings are now `STARTUP_SHUTDOWN_LABEL` / `STARTUP_SHUTDOWN_CATEGORY` so the writer and the colour test cannot drift apart | `PARITY` | **Done.** Special-cased at the session row, not in `groupColor` — a project with a real "Startup/Shutdown" delay code keeps its palette colour on the tile grid, which is how the PWA behaves |
| 3 | `—` | Shift-start time pre-fill | Pre-fills `lastShiftStartTime` — crews start at the same hour, usually one tap | Same. `beginShift` keeps a sticky `lastShiftStartISO` that End of Day does not clear; the stepper is seeded when you navigate to the screen, not at mount, so it sees the loaded cache | `PARITY` | **Done.** Also had to loosen the rewind rule — see the note under this table |
| 4 | `—` | Shift-end time picker | Same stepper, pre-filled from `lastShiftEndTime` | Same, from a sticky `lastShiftEndISO`, but clamped: if yesterday's end time is still in the future today, it falls back to now | `PARITY` | **Done.** The clamp stops an early End of Day defaulting to a time that hasn't happened yet |
| 5 | `—` | Project picker | Active `projects`, client name as subtitle, "last used" badge from saved `selectedProjectId` | `jfb_projects` with `client_name` as subtitle; last-used project/equipment/operator persisted through `useLastUsedSelection` so all three badges fire | `PARITY` | ~~Port client subtitle; persist last-used~~ **Done.** The stored `{projectId, equipmentId, operatorId, savedAt}` is what selection memory and same-day resume were then built on |
| 6 | `—` | Equipment auto-select when one unit | Skips picker when roster has one entry | Same check on `proj.equipment.length === 1` | `PARITY` | — |
| 7 | `—` | **Selection memory across reloads** | `checkNeedsPicker` + `selectionSessionMs` — project/equipment/operator silently reused. Constant is `345600000` = **96h**; the comment beside it says 20 hours and is stale — port the constant, not the comment | Same 96h window, from the same constant. `useLastUsedSelection` derives `fresh` when the cache resolves; boot then resolves the remembered project, equipment and operator against live data and skips the pickers entirely | `PARITY` | **Done.** Ported the constant, not the stale comment. Falls through to the pickers if any remembered record no longer resolves — a retired unit or unassigned operator — rather than confirming a half-broken setup |
| 8 | `—` | Same-day resume | `shiftStartDate === today` → boots straight to the grid | Same. `beginShift` persists `shiftStartISO` / `shiftDate` / `sessionId`; on boot the page holds a "Checking for an open shift…" gate until the cache and `jfb_projects` resolve, then rehydrates project, equipment, operator, shift start and session id and lands on the grid. Falls back to the picker if the shift is from another day or the remembered equipment/operator no longer resolve. End of Day clears it | `PARITY` | **Done.** Crash recovery still wins over resume, as before |
| 9 | `—` | "Confirm your setup" screen | Shown at the start of each new day, Change on every row | Same. Boot has three outcomes: fresh selection **and** a shift started today → straight to the grid; fresh selection, no shift today → `ConfirmSetupScreen` with the context pre-filled; otherwise the full picker walk. Confirm routes on to the shift-start picker, as in the PWA | `PARITY` | **Done** |
| 10 | `—` | Retired records hidden (active flags) — also covers the tracking dropdowns | `.eq('active', true)` on all eight Supabase reads; one column name throughout | Six filters in `buildProjects`, each matching its domain's **real** column, which is not uniform: `is_active` for projects, areas, equipment, project_operators; `active` for layers, delay codes. `jfb_equipments` had no flag at all — added to the domain and published | `PARITY` | **Done.** `jfb_operators` still has no flag of its own, but the `jfb_project_operators.is_active` assignment row covers the picker. The `jfb_delay_codes` master is reached by FK from an already-filtered row, so an inactive master code could still surface — the PWA sidesteps this by not joining the master at all |
| 11 | `—` | Delay-code tile grid | Grouped by category, auto-coloured from a 24-colour array | Same grouping, byte-identical array in `theme/index.js` | `PARITY` | — |
| 12 | `—` | Favourites (max 5) | Persisted per **device** + project in IndexedDB settings, so two operators sharing an iPad share each other's pins | Persisted per **operator** + project via `useFavoriteCodes`, falling back to a device scope only when a project has no roster and the name was typed in. Survives reload | `PARITY` | **Done, and scoped better than the PWA.** `jfb_operators.favourite_activity_ids` exists in the domain but is unused by every app and has no defined format — that's the upgrade path if operators start moving between tablets (see below) |
| 13 | `—` | Productive tile label from work type | Equipment work type pins discipline, falls back to project | `effectiveWorkType` in `dailyTrackingFormat.js` implements the same rule | `PARITY` | — |
| 14 | `—` | Area cascade | One select per level the project defines, project's own labels, stops at first unused level | 3 levels from `jfb_project_area_levels` depth, same contiguity rule | `PARITY` | — |
| 15 | `—` | Toast feedback | Confirms every start, stop, save, recovery, error | `@mantine/notifications` (top-center, max 3, 420px), wrapped in `notify.js` with four tones. Covers start, save, delete, recover, discard, day logged, past session added — plus two the PWA has no equivalent for: **"Saved offline"** when a write falls to the queue, and **"Session not saved"** when even queueing fails. A successful queue drain announces how many synced | `PARITY` | **Done.** Success paths auto-close in 2.5s; warnings and errors persist longer and carry a close button, since those are the ones an operator must actually read |
| 16 | `—` | Pre-shift gap | Written on first tile tap, guarded on no sessions yet | Written when the first session starts, clamped so a gap can never begin before the shift did | `PARITY` | Equivalent; native clamp is sturdier |
| 17 | `—` | Gaps between sessions | Not logged — stop, wait 20 min, start again and the time vanishes | Logged as "Between sessions" when the next session starts | `AHEAD` | Consider back-porting to the PWA while it's still in the field |
| 18 | `—` | Post-shift gap | Last session end → shift end, "ride back to shore" | Same rule, same label | `PARITY` | — |
| 19 | `—` | Whole-shift gap when nothing logged | Full shift as one `STARTUP/SHUTDOWN` row | Same | `PARITY` | — |
| 20 | `—` | "Skip — use current time" | Calls `finalizeEndOfDay()` directly, bypassing all gap logging — silently drops the post-shift row | Passes the real clock time through the same path, gaps still written | `AHEAD` | Native is correct; the PWA has a live bug here |
| 21 | `—` | Add past session | Date/time pair, category, operator, legacy Code field, area, pass, description | Same minus Code, reuses the shared area-cascade component | `PARITY` | — (Code field is legacy) |
| 22 | `—` | Recovery snapshot contents | IndexedDB settings, including operator name | localStorage, now including `shiftStartISO` and a gap anchor so recovery can't fabricate an all-day gap | `AHEAD` | Native carries more; nothing to port |
| 23 | `—` | Reference data cached for offline | None. Supabase unreachable → fetchers return `[]` → empty tile grid | Every domain read cached to IndexedDB and served on failure, with offline banner and cached app shell | `AHEAD` | Native substantially better; nothing to port |

## Five decisions that aren't mine to make

- **Whether deleting a session should void the server record.** Neither app does it today: both remove the
  row locally and leave the backend copy in place. The native app now says so in its toast; the PWA's says
  "Session deleted", which isn't true. If delete is meant to retract a record, that needs a write path and a
  policy for already-reported days — it is not a port gap, since there is nothing to port it from.
- **Cold-start offline.** The native app cannot boot without the portal frame. If iPads go out of signal
  and reboot, that is a hard stop with no workaround in the frontend.
- **Lane / Step persistence.** Deriving the flag is a frontend change; persisting `lane` and `step` needs
  columns on `jfb_daily_activities`, which is a schema conversation with Dustin.
- **Whether favourites should follow the operator between tablets.** They are now stored per operator, but
  on the device. `jfb_operators.favourite_activity_ids` (text, nullable, no description, written by nothing)
  is where they would live server-side. Syncing costs an `updateDomainRecord` path — `data/index.js` only
  does `operation: 'insert'` today — plus offline queueing, since a star tap must never fail on a barge, plus
  a decision on the column's format plainly documented in that empty description. Worth it only if operators
  actually change tablets often; if a tablet stays with its machine, local is indistinguishable.
- **Operator name without a roster.** The PWA lets an operator type their name and stores it, because
  `daily_events.operator_name` is text. `jfb_daily_activities` has only the `operator_id` FK, so the native
  fallback can unblock the shift but cannot attribute it. Either add `operator_name` text to the domain
  (mirrors the PWA, one column) or accept that empty-roster projects log unattributed sessions. Auto-creating
  `jfb_operators` rows from a field device would give a real FK but invites duplicate people, which is why
  neither app does it today.
