# Dot to Dot — Port Matrix

Every behaviour in the legacy Supabase PWA (`jfb/jfb-dot-to-dot`) set against the Pivotly native app
(`jfb/jfb-dot-to-dot-native-app`). The two write to different backends — `daily_events` via Supabase
versus `jfb_daily_activities` via `core-data-write` — so what ports is **the rule, not the query**.

| Status | Count | Meaning |
|---|---|---|
| `MISSING` | 9 | Not in the native app at all |
| `DIFFERS` | 16 | Present but behaves differently |
| `PARITY` | 8 | Equivalent already, nothing to do |
| `AHEAD` | 4 | Native is better; nothing to port |
| `ARCH` | 2 | Architectural difference, needs a decision |
| **Total** | **39** | |

---

## 1. Setup & shift start

| Feature | Legacy PWA | Native app | Status | What to do |
|---|---|---|---|---|
| Project picker | Active `projects`, client name as subtitle, "last used" badge from saved `selectedProjectId` | `jfb_projects`, no subtitle. `selectedId={project?.id}` is null at this step so the badge never renders | `DIFFERS` | Port client subtitle; persist last-used so the badge fires |
| Equipment auto-select when one unit | Skips picker when roster has one entry | Same check on `proj.equipment.length === 1` | `PARITY` | — |
| Operator picker | Initials avatar, plus free-text fallback when roster is empty | Plain list. No fallback — a project with no operators dead-ends the flow | `DIFFERS` | Port the text fallback; avatars are cosmetic |
| **Selection memory across reloads** | `checkNeedsPicker` + `selectionSessionMs` — project/equipment/operator silently reused. Constant is `345600000` = **96h**; the comment beside it says 20 hours and is stale — port the constant, not the comment | Nothing. Every reload restarts at the project picker | `MISSING` | **Biggest day-to-day regression.** Store the three IDs + timestamp in the existing IndexedDB shell cache |
| Same-day resume | `shiftStartDate === today` → boots straight to the grid | Nothing — full setup walk every launch | `MISSING` | Pairs with selection memory, same storage |
| "Confirm your setup" screen | Shown at the start of each new day, Change on every row | `ConfirmSetupScreen` exists and matches, but only reachable after End of Day | `DIFFERS` | Route to it on a new day once selection memory lands |
| Shift-start time pre-fill | Pre-fills `lastShiftStartTime` — crews start at the same hour, usually one tap | Pre-fills now rounded to 5 min; operator dials back every morning | `DIFFERS` | Persist last shift start, pre-fill from it |

## 2. Tracking screen

| Feature | Legacy PWA | Native app | Status | What to do |
|---|---|---|---|---|
| Delay-code tile grid | Grouped by category, auto-coloured from a 24-colour array | Same grouping, byte-identical array in `theme/index.js` | `PARITY` | — |
| **Delay codes filtered by work type** | `getDelayCodes(workType)`; null-work_type codes always show. Comment: Torch Lake would otherwise show ~91 tiles | No filter — every active project code renders. `buildProjects` doesn't even carry `work_type` onto the mapped code, so there is nothing to filter on yet | `MISSING` | **Corruption risk.** A placement event can be tagged with a dredging code, breaking cross-project `delay_code_num` rollups. Add `work_type` to the delay-code map in `buildProjects`, then filter on `null` OR the machine's work type |
| Favourites (max 5) | Persisted per project in IndexedDB settings | `favoritesByProject` React state, lost on reload | `DIFFERS` | Persist to the same store as selection memory |
| Productive tile label from work type | Equipment work type pins discipline, falls back to project | `effectiveWorkType` in `dailyTrackingFormat.js` implements the same rule | `PARITY` | — |
| Legacy category values on read | `isActiveCategory()` treats `ACTIVE DREDGING`, `ACTIVE PLACEMENT` **and** legacy `ACTIVE CAPPING` as productive; `displayCategory()` remaps a stored value to the current label before rendering. (Note: `activeCategory()` and `activeLabel()` are separate functions but return identical values today — the write/display split is nominal) | Neither function exists. `s.category` is rendered raw, and colour selection has no productive-category test | `DIFFERS` | Port `isActiveCategory` + `displayCategory`. Matters the moment anything renders a historical row |
| **Lane / Step prompt** | `usesLaneStep()` = `isCapping && isHydraulic`. Comment records any-capping was wrong and had Weigand's mechanical operator answering it for months | Hardcoded false via empty `PROJECT_EXTRAS_BY_NAME`; modal unreachable. Lane/step are display-only, never in the write payload | `MISSING` | Derive from work type, then give the fields somewhere to land in the schema |
| Area cascade | One select per level the project defines, project's own labels, stops at first unused level | 3 levels from `jfb_project_area_levels` depth, same contiguity rule | `PARITY` | — |
| Pass / Lift / Layer field | Three modes: pass types (dredging), fixed Lift 1–8 (capping), named layers (multi-layer), label switches | Two modes only — capping projects get pass types where they should get lifts | `DIFFERS` | Add the Lift 1–8 branch and label switch |
| **Multi-layer gate** | `isMultiLayerProject()` requires capping **and** >1 layer; comment calls the capping test load-bearing | `projectsViewModel.js:42` checks only `layers.length > 1` | `DIFFERS` | **Bug.** Add the capping condition — otherwise Torch Lake's dredge operator writes `layer_id` with a null `pass_number` |
| Session log | Grouped by date, per-day totals, Today/Yesterday headers, read from IndexedDB so it survives reload | Flat list in React state, current run only, never cleared between shifts | `DIFFERS` | PWA is better. Persist and group by date |
| Delete a session | Confirm dialog, removes from IndexedDB — but not from Supabase | Removes from React state only; no confirm, no persistence, row stays in the DB | `DIFFERS` | Neither is right. Decide whether delete means void the record, then do it once properly |
| Toast feedback | Confirms every start, stop, save, recovery, error | Silent — nothing tells the operator a session was written | `MISSING` | Mantine notifications; cheap, and the operators rely on it |

## 3. End of day & gap logging

| Feature | Legacy PWA | Native app | Status | What to do |
|---|---|---|---|---|
| Shift-end time picker | Same stepper, pre-filled from `lastShiftEndTime` | Same stepper, pre-filled from now rounded to 5 min | `DIFFERS` | Persist last shift end alongside last shift start |
| Pre-shift gap | Written on first tile tap, guarded on no sessions yet | Written when the first session starts, clamped so a gap can never begin before the shift did | `PARITY` | Equivalent; native clamp is sturdier |
| Gaps between sessions | Not logged — stop, wait 20 min, start again and the time vanishes | Logged as "Between sessions" when the next session starts | `AHEAD` | Consider back-porting to the PWA while it's still in the field |
| Post-shift gap | Last session end → shift end, "ride back to shore" | Same rule, same label | `PARITY` | — |
| Whole-shift gap when nothing logged | Full shift as one `STARTUP/SHUTDOWN` row | Same | `PARITY` | — |
| "Skip — use current time" | Calls `finalizeEndOfDay()` directly, bypassing all gap logging — silently drops the post-shift row | Passes the real clock time through the same path, gaps still written | `AHEAD` | Native is correct; the PWA has a live bug here |
| Reset for the next shift | Clears `shiftStartDate`, returns to confirm screen. Log is date-grouped so carry-over is intentional | Steps to `confirmSetup` but never clears `sessions` — a second shift inherits the first's list and running total | `DIFFERS` | Clear on new shift, but distinguish that from Change Operator, which re-enters the same screen |

## 4. Past sessions & crash recovery

| Feature | Legacy PWA | Native app | Status | What to do |
|---|---|---|---|---|
| Add past session | Date/time pair, category, operator, legacy Code field, area, pass, description | Same minus Code, reuses the shared area-cascade component | `PARITY` | — (Code field is legacy) |
| Interrupted-session recovery | Overlay with activity badge, start time **and day**, elapsed, and an area/pass summary line | Same overlay and stepper, no area/pass summary, no start day | `DIFFERS` | Add the context line — it's what tells the operator which session this was |
| Recovery snapshot contents | IndexedDB settings, including operator name | localStorage, now including `shiftStartISO` and a gap anchor so recovery can't fabricate an all-day gap | `AHEAD` | Native carries more; nothing to port |

## 5. Offline & sync

| Feature | Legacy PWA | Native app | Status | What to do |
|---|---|---|---|---|
| Write-behind queue | Attempts counted per item; 10 failures mark it `failed` so it stops burning retries and surfaces | Drains every 30s and on `online`, but retries forever — no attempt cap, no failed state | `DIFFERS` | Port the attempt counter and terminal failed state |
| **Duplicate protection on retry** | Every row carries `local_id`, upserted `onConflict: 'local_id'` — re-sending is harmless | `core-data-write` sends `operation: 'insert'`. A `local_id` *is* generated in `saveDailyActivity` but only as the IndexedDB queue key — it never enters `recordData`, so nothing reaches the server to dedupe on. A write that succeeded but whose response was lost is re-sent by the drain and lands twice | `MISSING` | **Most consequential gap in this table.** The key already exists client-side; put it in the payload and give the backend something to key on |
| Sync status UI | Corner pill: syncing count / sync issue / synced then auto-hides. Surfaces the failed state | Header button + modal listing each pending item with queue timestamps and manual Retry | `DIFFERS` | Native is richer but can't show failures — add the failed state to it |
| Reference data cached for offline | None. Supabase unreachable → fetchers return `[]` → empty tile grid | Every domain read cached to IndexedDB and served on failure, with offline banner and cached app shell | `AHEAD` | Native substantially better; nothing to port |
| Cold-start offline | Service worker, network-first with cache fallback, installable to home screen. Works from a dead start with no network | No service worker — boots off a `postMessage` handshake with the Pivotly portal frame | `ARCH` | **Decide deliberately.** An iPad that reboots out of signal cannot open the native app at all |

## 6. Platform & shell

| Feature | Legacy PWA | Native app | Status | What to do |
|---|---|---|---|---|
| Change operator mid-shift | Ends the running session, picks a new operator, returns straight to the grid. Has a Cancel | Re-enters the operator step then walks the shift-start screen again | `DIFFERS` | Port the fast swap — it also removes the reason the shift-start screen is re-entrant |
| Build version badge | Corner pill showing the running build so the field can confirm what an iPad is on | None | `MISSING` | Trivial, pays for itself the first time someone reports a fixed bug |
| Settings modal | Project name/code/client/dredge fields, plus Clear 48hr and Clear All for the device log | None | `MISSING` | Mostly legacy — project fields come from the backend now. Only the clear actions are worth porting |
| Back-button trap | `popstate` re-push so Android back dismisses an overlay instead of leaving the app | N/A — runs in an iframe, react-router removed | `ARCH` | — |
| Headless test harness | `scripts/test-equipment-phase.mjs` runs the real class in a VM to assert work-type branching without a browser or Supabase | No tests of any kind | `MISSING` | Port early — every work-type rule above is exactly what it covers |

---

## Port order

Ranked by what breaks or corrupts data, not by effort. The first three write wrong rows into
`jfb_daily_activities`; everything below is workflow the operators lose.

1. **Idempotent writes.** The PWA upserts on `local_id`; the native app inserts. A write that succeeded
   but whose response was lost gets re-sent by the drain and lands twice.
2. **Gate the layer dropdown on capping.** One missing condition hands Torch Lake's dredge operator a
   list of backfill materials instead of his passes.
3. **Filter delay codes by work type.** Without it a placement event can be tagged with a dredging code,
   corrupting the cross-project `delay_code_num` rollups.
4. **Remember the selection.** Every reload currently sends the operator back to the project picker.
5. **Lane / Step, derived not hardcoded.** `usesLaneStep` is `isCapping && isHydraulic`, and the fields
   need somewhere to land.
6. **Everything else** in the tables above, by status.

## Two decisions that aren't mine to make

- **Cold-start offline.** The native app cannot boot without the portal frame. If iPads go out of signal
  and reboot, that is a hard stop with no workaround in the frontend.
- **Lane / Step persistence.** Deriving the flag is a frontend change; persisting `lane` and `step` needs
  columns on `jfb_daily_activities`, which is a schema conversation with Dustin.
