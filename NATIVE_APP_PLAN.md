# jfb-dot-to-dot-native-app — Build Plan

Goal: rebuild `jfb-dot-to-dot` (the operator time-tracking PWA) as a Pivotly-hosted native app, keeping the proven UX but adapting the identity model to fit inside Pivotly's single-login shell. This document is the screen/page inventory from the planning discussion — no code has been written against it yet.

## Key decisions

1. **One login per device: the admin account (`francis@pivotly.com`), for now.** This is the Pivotly-level login that unlocks the app at all — the `PIVOTLY_APP_CONFIG` handshake this shell already does with its parent. It sits *above* everything else; it does not replace operator selection.
2. **Operator self-select stays exactly as it already works today.** `jfb-dot-to-dot` never had per-operator passwords — picking an operator has always just been tapping a name off a list (or free-text if none are configured). Nothing changes here: the single Pivotly login gatekeeps the device/app, and whichever operator is actually running equipment still just picks their name each shift.
3. **No Settings screen.** The ⚙ Settings modal (project read-only info, "Clear 48hr Sessions" / "Clear ALL Sessions") is not part of this app. Not deferred — excluded.
4. **Domain/data-source mapping is out of scope for this pass.** Which Pivotly `domain` backs each screen, `core-data-read`/`core-data-write` wiring, picklists — none of that is decided here. This document is screens/pages only.

## Screen inventory (source: `jfb-dot-to-dot`, all 11 screens)

| # | Screen | In native app? | Notes |
|---|---|---|---|
| 1 | Select Project | ✅ | Unchanged |
| 2 | Select Equipment | ✅ | Unchanged, incl. auto-skip when a project has only one piece of equipment |
| 3 | Who is operating? (operator picker) | ✅ | This **is** "operator selects themselves" — already password-less today, nothing to change |
| 4 | What time did the shift start? | ✅ | Unchanged |
| 5 | Main tracking screen (header, status bar, active session bar, session fields, categories grid, totals, sessions list) | ✅ | The core screen — unchanged in function |
| 6 | Lane & Step modal (capping projects only) | ✅ | Stays a modal launched from screen 5, not its own page |
| 7 | "Good morning — confirm your setup" (returning-day screen) | ✅ | Unchanged |
| 8 | "Session interrupted" (crash recovery) | ✅ | Unchanged |
| 9 | "What time did the shift end?" (End of Day) | ✅ | Unchanged |
| 10 | Add Past Session modal | ✅ | Stays a modal launched from screen 5, not its own page |
| 11 | Settings modal | ❌ **Excluded** | Per decision above |

## Recommended app-pages to create

The native-app shell registers one page per nav item (a `page_slug`, resolved and rendered by `PageContent/index.jsx` — same pattern as the existing `CrewRosterPage`). Screens 1–4 and 7–10 aren't separate destinations a user browses between; they're one continuous per-shift workflow that funnels into screen 5, exactly like `CrewRosterPage` is one self-contained page with its own Add/Edit modals. Recommendation: **this is one app-page, not several.**

### Page: "Daily Tracking" (the only page needed)
One nav entry, one `page_slug`, one custom component (parallel to `CrewRosterPage.jsx`). Internally it owns local overlay/modal state for the full flow:

- Select Project → Select Equipment → Who is operating? → Shift start *(first-run / expired-selection path)*
- "Good morning — confirm your setup" *(returning-day path)*
- Main tracking screen *(default view once setup is resolved)*
- Lane & Step modal, Add Past Session modal, Session-interrupted recovery, End-of-Day *(all launched from the main tracking screen)*

No second page is needed unless a future requirement calls for something operators would navigate to independently (e.g., a standalone history/reports view) — nothing in the current screen set needs that.

## Explicitly out of scope right now

- Settings screen — dropped, not rebuilt in any form
- Per-operator authentication — never existed in the source app, not being introduced
- Which Pivotly `domain`/`system` backs project/equipment/operator/delay-code/session data — deferred
- Offline sync strategy specifics (mirrors `useOfflinePersonRoster` pattern, but not decided here)
