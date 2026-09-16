# Dot to Dot (reference PWA) — Test Plan

Manual test pass for the legacy Supabase PWA in `jfb/jfb-dot-to-dot` — the app running on the iPads today.

This covers the PWA on its own terms. It is **not** a comparison with the native app: where the two differ,
what is written here is what the PWA does, whether or not that is the behaviour anyone wants. Cases derived
from `PORT_MATRIX.md`, but the port status of a feature has no bearing on whether it is tested here.

Test on an **iPad in Safari**, not a desktop browser. Several defects below only show up on a real device,
and the touch targets and the standalone-install behaviour cannot be judged on a laptop.

---

## Before you start

**1. Check which backend you are pointed at.** `js/config.js` decides this and it is easy to get wrong —
the working copy is currently pointed at `http://127.0.0.1:54321` with the production credentials commented
out above it. Confirm you are on the backend you mean to test before anything else. Testing a write path
against the wrong database either loses your results or writes junk into production.

**2. Note the build.** The version badge sits in the bottom corner of the main screen. Record it with your
results — `APP_VERSION` in `js/app.js` and `CACHE_NAME` in `js/sw.js` are meant to be bumped together, so if
a fix you expect is missing, a stale service worker cache is the first thing to suspect.

**3. Clear device state between runs where a case says so.** Safari → Settings → Clear History and Website
Data, or delete and reinstall the home-screen app. The app keeps project/equipment/operator selections for
**96 hours**, so without clearing you will not see the first-launch flow again.

---

## Test data you need

The work-type branching is most of the risk in this app, and it cannot be tested on one project. You need
access to at least these four shapes, all with active delay codes and areas configured:

| Shape | Example project | Why it is needed |
|---|---|---|
| Hydraulic dredging | Fountain Lake | The baseline. Pass list, no Lane/Step, ACTIVE DREDGING tile |
| Hydraulic capping | Penobscot 152505, Cocoa 172507 | The only shape that gets the Lane/Step prompt |
| Mechanical capping, >1 named layer | Weigand 422509 | Layer dropdown instead of a Lift list |
| Two disciplines at once | Torch Lake 152601 | CAT 374 dredges, Sennebogen 840 places — equipment-level `work_type` override |

If you can only get one project, do section **D** and **E** and skip **F** and **G** — but say so in the
results, because those two sections cover the logic most likely to be wrong.

---

## Known defects — do not re-report these

These are confirmed in the code. They are listed so you do not spend time on them, and so you can confirm
they still behave as described. Each has a case below that exercises it.

| ID | What you will see | Case |
|---|---|---|
| **KD-1** | After about 19:00 Central, work is filed to **tomorrow's** date — in the log's date headers and in the report date sent to the backend. The session log groups on a UTC date key | J2 |
| **KD-2** | Add Past Session opens pre-filled with **tomorrow's** date after about 19:00 Central. The time beside it is correct, which is what makes it easy to miss | I1 |
| **KD-3** | **Offline for more than five minutes loses sessions permanently.** The sync queue gives up after 10 attempts at 30-second intervals, marks the item failed, and never retries it — returning signal does not recover them | M3 |
| **KD-4** | "Skip — use current time" at End of Day silently skips **all** gap logging, including the post-shift row. The Confirm button does log them | N3 |
| **KD-5** | Deleting a session says "Session deleted", but only the on-device copy is removed. The synced record stays in the backend | K1 |
| **KD-6** | Re-tapping the tile that is already running splits one stretch into two adjacent rows of the same category | E5 |
| **KD-7** | A night shift crossing midnight does not resume. Reopening a 22:00 shift at 02:00 returns you to the setup screen instead of the running grid | C1 |
| **KD-8** | Saving the Settings modal blanks the project name in the header until the next reload | K3 |

---

## A. Environment and install

**A1 — Backend.** Open the app and start a session on a test project. Confirm the row appears in the
backend you intended. *Expect:* the row lands where you expect, not in production, not nowhere.

**A2 — Version badge.** *Expect:* a small version string in the bottom corner of the main screen, readable
against the background. Record it.

**A3 — Install to home screen.** Add to Home Screen, then open from the icon. *Expect:* opens full-screen
with no Safari chrome, Brennan icon and splash, and the app works normally.

**A4 — Cold start with no network.** Install first while online, then put the iPad in Airplane Mode and
launch from the icon. *Expect:* the app shell loads. Project and delay-code lists will be empty or stale —
that is expected, the shell is cached but the data is not.

---

## B. First launch — the setup walk

Clear device state before this section.

**B1 — Project picker.** *Expect:* Brennan logo, "Select Project", today's date, and one button per active
project showing the project name with the client name beneath it. No Back or Cancel — this is the first step.

**B2 — Equipment picker, several units.** Pick a project with more than one active unit. *Expect:* "Select
Equipment" listing each unit, with the project name as the subtitle.

**B3 — Equipment picker, one unit.** Pick a project with exactly one active unit. *Expect:* the equipment
step is **skipped entirely** and you land on the operator picker with that unit already chosen.

**B4 — Operator picker.** *Expect:* "Who is operating?", subtitle showing `equipment · project`, and each
operator as a row with a circular initials badge.

**B5 — Operator picker, empty roster.** Use a project with no active operators. *Expect:* instead of a list,
a free-text "Enter name…" box and a Continue button. The typed name is accepted and used.

**B6 — Shift start time.** *Expect:* "What time did the shift start?", a large HH:MM AM/PM display, and
Hour −/+ and Minutes −/+ buttons. Minutes move in **5-minute** steps; hours wrap 23 → 00. Confirm lands on
the main grid.

**B7 — Shift start, skip.** Repeat B6 but tap "Skip — start from now". *Expect:* shift start is set to the
current time and you land on the grid.

---

## C. Returning launches

**C1 — Same-day resume.** Complete the setup walk, then force-quit and reopen. *Expect:* straight to the
main grid, no setup screens, selections intact.
⚠ **KD-7:** if the shift began before midnight and you reopen after it, you get the setup screen instead.

**C2 — New day.** With selections less than 96 hours old but the shift started on a previous day, reopen.
*Expect:* "Good morning — confirm your setup" listing Project, Equipment and Operator with a Change button
on each, then Confirm & Set Shift Start.

**C3 — Change a selection from the confirm screen.** Tap Change on each row in turn. *Expect:* each opens
the matching picker, and completing it returns you through the shift-start screen to the grid.

**C4 — Selection expiry.** Leave the device unused for more than 96 hours, or clear site data. *Expect:* the
full setup walk from B1, with the previous choices marked "last used".

**C5 — Change operator mid-shift.** With a session running, tap the 👤 button. *Expect:* the running session
is **saved first** (toast "Session saved"), then the operator picker appears with a Cancel. Picking a name
returns straight to the grid — no shift-start screen. Cancel returns to the grid with nothing changed.

---

## D. The tile grid

**D1 — Productive tile label.** *Expect:* on a dredging project the top full-width green tile reads
**ACTIVE DREDGING**; on a capping or placement project it reads **ACTIVE PLACEMENT**.

**D2 — Delay codes.** *Expect:* below the productive tile, every active delay code for the project, grouped
under its category heading, each group in its own colour, colours consistent within a group.

**D3 — Pin a favourite.** Tap the ☆ on a delay tile. *Expect:* the star fills, and a "★ Favorites" row
appears above the category groups containing that tile. The star does **not** start a session.

**D4 — Favourites cap.** Pin five, then try a sixth. *Expect:* refused, with the toast "You can pin up to 5
favorites". The sixth star does not fill and nothing is silently unpinned.

**D5 — Favourites persist.** Force-quit and reopen. *Expect:* the same tiles are still pinned. Note that
favourites are stored **per device and project**, so two operators sharing an iPad share each other's pins.

**D6 — Project with no delay codes.** *Expect:* a message that no delay codes are configured, and the
productive tile still available above it.

---

## E. Recording a session

**E1 — Start.** Tap any tile. *Expect:* toast "Started: …", the status line changes to "● Recording: …",
the active-session bar appears with a timer counting in HH:MM:SS, and the tile is highlighted.

**E2 — Area cascade.** *Expect:* one dropdown per area level the project actually defines, labelled with the
project's own level names. Choosing a level-1 value populates level 2; changing level 1 clears the deeper
levels. A project with no areas shows no area dropdowns at all.

**E3 — Pass field.** *Expect:* on a dredging project, label "Pass" with the project's pass types. On a
single-layer capping project, label "Lift" with Lift 1–8 and N/A. On a multi-layer capping project, label
"Layer" with the project's own layer names.

**E4 — Notes.** Type a note, then stop the session. *Expect:* the note is attached to that session, and the
Notes box is **empty** for the next one.

**E5 — Switch activity.** With one tile running, tap a different tile. *Expect:* the first session is saved
and the second starts, back to back with no gap between them.
⚠ **KD-6:** tapping the tile that is *already running* also splits it into two rows.

**E6 — Stop.** Tap ■ Stop. *Expect:* toast "Session saved!", the row appears at the top of the log with the
right start, end and duration, the timer bar disappears and the status returns to "● Ready".

---

## F. Capping-specific behaviour

**F1 — Lane and Step, hydraulic capping.** On Penobscot or Cocoa, tap any tile. *Expect:* a "Lane & Step"
modal **before** the session starts, pre-filled with the last values entered. Continue starts the session;
the ✕ dismisses it and does **not** switch activity.

**F2 — Lane and Step must not appear elsewhere.** Repeat on a mechanical capping project (Weigand) and on a
dredging project. *Expect:* no prompt at all — the session starts immediately.

**F3 — Layer dropdown.** On Weigand, check the pass field. *Expect:* label "Layer", listing the project's
real layer names, not "Lift 1…8".

---

## G. Two disciplines on one project (Torch Lake)

This is the case the per-equipment override exists for, and the easiest to get wrong.

**G1 — Dredge unit.** Start a shift on Torch Lake with the **CAT 374**. *Expect:* productive tile reads
ACTIVE DREDGING, pass field is labelled "Pass" with pass types, **no** Layer dropdown, no Lane/Step prompt.

**G2 — Placement unit.** Change equipment to the **Sennebogen 840** on the same project. *Expect:*
productive tile now reads ACTIVE PLACEMENT, pass field is labelled "Layer" with the named layers, still no
Lane/Step prompt.

**G3 — Delay tiles differ by unit.** Compare the tile grid between G1 and G2. *Expect:* each unit sees the
codes for its own discipline, not the combined set of both.

---

## H. Automatic gap logging

**H1 — Pre-shift gap.** Set a shift start well before now, then tap your first tile. *Expect:* a
STARTUP/SHUTDOWN row appears covering shift start → first tap, described as safety meeting / pre-shift, and
it appears immediately rather than at End of Day.

**H2 — No gap when there is nothing to log.** Set shift start to the current time and tap a tile within a
minute. *Expect:* no gap row.

**H3 — Pre-shift gap logged once only.** After H1, stop and start more sessions. *Expect:* no second
pre-shift row.

**H4 — Post-shift gap.** Stop your last session, wait a few minutes, then End of Day and Confirm with a
later end time. *Expect:* a STARTUP/SHUTDOWN row from the last session's end to the shift end, described as
post-shift / ride back.

**H5 — Whole shift with no tile taps.** Start a shift and go straight to End of Day without tapping
anything. *Expect:* a single STARTUP/SHUTDOWN row covering the entire shift.

**H6 — Gaps between sessions are not logged.** Stop a session, wait 20 minutes, start another. *Expect:*
the 20 minutes is **not** recorded anywhere. This is current behaviour, not a bug to report.

---

## I. Add Past Session

**I1 — Defaults.** Tap the ✚ button. *Expect:* start and end dates pre-filled with today, times 08:00 and
09:00, and the activity list showing the productive tile plus every delay code grouped by category.
⚠ **KD-2:** after about 19:00 Central the dates pre-fill as **tomorrow**.

**I2 — Save.** Fill in a past window, pick an activity, operator, area and pass, then Save. *Expect:* toast
"Session added!" and the row in the log at its correct place in time order.

**I3 — Validation.** Set the end time earlier than the start time and save. *Expect:* refused with "End time
must be after start time". Then clear the activity and save. *Expect:* refused with "Please select an
activity".

---

## J. Session log and totals

**J1 — Grouping.** *Expect:* rows grouped under date headers — "Today - …", "Yesterday - …", then weekday
and date for older days. Each header shows that day's session count and hour total. Newest day first, and
newest session first within a day.

**J2 — Date boundary.** Record a session after about 19:00 Central and check which header it lands under.
⚠ **KD-1:** it will appear under **tomorrow's** header, and be sent to the backend with tomorrow's report
date. Confirm and record it; do not raise it as new.

**J3 — Totals.** *Expect:* the "Total Hours" line sums **every session on the device**, not just today's, so
it will exceed the day's header total. The status bar count behaves the same way.

**J4 — Colours.** *Expect:* the colour bar on each row matches its delay-code group. Auto-logged
STARTUP/SHUTDOWN rows are a distinct grey, and productive rows are green.

---

## K. Delete and clear

**K1 — Delete a session.** Tap ✕ on a row. *Expect:* a confirmation dialog, then the row disappears and a
toast reads "Session deleted".
⚠ **KD-5:** the backend copy is **not** removed. Check the backend and confirm the row is still there.

**K2 — Clear 48hr and Clear All.** Settings → Device Data. *Expect:* Clear 48hr removes only the last two
days and reports how many; Clear All asks **twice** before deleting everything. Neither touches the backend.

**K3 — Settings save.** Open Settings, change the project name, Save. *Expect:* toast "Settings saved!".
⚠ **KD-8:** the header's project name goes blank until you reload.

---

## L. Crash recovery

**L1 — Recover.** Start a session, then force-quit the app from the app switcher while it is still running.
Reopen. *Expect:* a full-screen "Session interrupted" screen with the activity badge, the start time **and
the day it started**, how long ago that was, an area/pass summary, and an end-time picker defaulting to now
rounded to 5 minutes. Save Session writes it with the end time you choose.

**L2 — Discard.** Repeat L1 and choose "Discard — session was already stopped". *Expect:* nothing is
written, and you land on the normal grid.

**L3 — Overnight recovery.** Repeat L1 but leave it interrupted until the next day. *Expect:* the start day
is shown clearly, and choosing an end time earlier than the start rolls it to the following day rather than
producing a negative duration.

---

## M. Offline and sync

The most important section. Do it on a real device with Airplane Mode, not with devtools throttling.

**M1 — Sync indicator.** With good signal, record a session. *Expect:* a corner pill showing "⏳ 1 syncing"
then "✓ synced", which hides itself after a few seconds.

**M2 — Short offline.** Airplane Mode on, record two sessions, Airplane Mode off within two minutes.
*Expect:* the pill shows a pending count while offline, then both rows reach the backend once signal returns.

**M3 — Long offline. This is the one that matters.** Airplane Mode on, record two or three sessions, and
leave it offline for **at least ten minutes**. Then turn Airplane Mode off and wait several minutes.
⚠ **KD-3:** *Expect:* the pill turns to "⚠ sync issue" and those sessions **never reach the backend**, even
with signal restored. Confirm this, note exactly how long you were offline and how many rows were lost, and
check the backend to confirm they are absent. This is the app's most serious defect — a full shift out of
signal loses the whole shift.

**M4 — Sessions survive a reload offline.** While offline, record a session, then force-quit and reopen.
*Expect:* the session is still in the log.

**M5 — Reference data offline.** Launch while offline on a device that has never loaded a project.
*Expect:* empty project and delay-code lists — the app does not cache reference data.

---

## N. End of Day

**N1 — Confirm.** Tap End of Day. *Expect:* if a session is running it is saved first, then "What time did
the shift end?" with the same stepper, pre-filled from the last shift end used. Confirm logs the post-shift
gap, toasts "Day logged", and returns to the setup screen.

**N2 — Next day.** After N1, reopen the app. *Expect:* the confirm-your-setup screen, not the running grid.

**N3 — Skip.** Repeat N1 but tap "Skip — use current time".
⚠ **KD-4:** *Expect:* **no gap rows are written at all** — not the post-shift row, not the whole-shift row.
Confirm by comparing against N1 on an otherwise identical shift.

**N4 — Log carries over.** After ending the day, check the session log. *Expect:* previous days' rows are
still listed under their own date headers. This is intended — use Clear 48hr / Clear All to trim.

---

## Recording results

One line per case. For anything that fails, note the project, the equipment, the time of day and the
version badge — several defects here only appear on particular project shapes or after 19:00 Central.

| Case | Pass / Fail / Skipped | Device + build | Notes |
|---|---|---|---|
| A1 | | | |
| … | | | |

Flag anything that costs data — a session that does not reach the backend, or one written against the wrong
day — separately from cosmetic problems, and put it in front of Dustin before the next shift starts.
