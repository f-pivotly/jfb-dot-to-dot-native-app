# Connecting domains to the app shell instead of a page-slug

Right now, `projects`/`operators`/`equipments` are connected via the **page**-level `data_access` on `apg-jfb-dot-to-dot-daily-event` (already built, published, and verified working). This document answers a different question: what would it take to connect them at the **app shell** level instead (the App Editor's "Data Sources" tab, on the `Overview`/`Data` tab you had open earlier — the one that showed "No shell-level data sources declared"), with no page-slug involved at all?

Every claim below is checked against the real stored-procedure source in `Core_Independent/src/sql/00108-pivotly_native_apps/`, not inferred.

## The trade-off to understand before choosing this

The nav bar and the page-rendering system (`PageContent/index.jsx`) are both built entirely around page-slugs — `fnc_app_resolve` returns `app.pages` (a list of page-slugs), and clicking one is what triggers `fnc_app_page_resolve` to fetch that page's own content/`data_access`. **There is no page-slug-free path in this system for something to appear as a clickable nav destination.** If you connect domains at the app level and skip the page-slug entirely, `DailyTrackingPage` has no way to show up in the nav — it would have to become the app's one permanent, always-shown screen (replacing the current `PageContent`/nav-driven routing entirely), not something the user navigates *to*.

The one genuine advantage of shell-level connection: it's declared **once** and would be available to *every* page in the app, instead of repeating the same `data_access` entries on each page that needs them. That only matters if you plan to add more pages later that all need the same 3 domains.

## Core_Independent — no changes needed

Read directly:
- `1300-fnc_app_resolve.sql` — already resolves `runtime_services.data` (the app's shell-level sources) into a top-level `data_access` array on every app resolve, via `core.fnc_app_data_access_resolve_array(...)` (line 103-105)
- `1240-fnc_app_data_access_resolve_array.sql` — already dispatches each declared source by `source_type` (`domain`/`view`/`file_set`) to the right resolver, preserving order
- `1210-fnc_app_domain_access_resolve.sql` — already resolves a user's effective CRUD access to any given domain via `core.fnc_iam_dac_cache_get(...)`

All of this already exists and works exactly the same way whether the source is declared on the app or on a page — confirmed, since `fnc_app_resolve` and `fnc_app_page_resolve` both ultimately call the same `fnc_app_data_access_resolve_array`. **No new SQL needed.**

One real (pre-existing, unrelated) gap worth knowing: `fnc_app_domain_access_resolve` returns all-false CRUD flags when there's no DAC (Domain Access Control) grant for that user+domain — we saw this exact all-false result for both the page-level and a would-be app-level connection. That's a separate permission-grant step, not something either approach fixes automatically.

## Backend (`Portal_Independent_Backend`) — no changes needed

`cfgItemSaveService.saveCfgItem` and `nativeAppService.publishApp` already handle this — we already used exactly this path (see `scripts/register-daily-tracking-nav.ts`) to edit an app's `cfg_data` and republish it. Connecting domains at the shell level is the same operation, just editing `cfg_data.runtime_services.data` instead of `cfg_data.pages`.

## Frontend — `Portal_Independent_Frontend` (App Editor UI) — no changes needed

This is literally what the "Data Sources" tab you already had open does (`src/app/config-editor/components/app/native/DataTab.jsx`) — add a row, set Source Type to `domain`, type in `projects`/`operators`/`equipments`, Save, Publish. No code change; just data entry, the same way you already created the page by hand.

## `jfb-dot-to-dot-native-app` — real changes needed here

This is the only place actual code changes are required:

1. **`src/data/index.js`** — `fetchNavItems` currently returns only `data?.data?.app?.pages`. Needs to expose the full `data.data` object (or a new `fetchAppResolve`) so `data_access` isn't discarded.
2. **`src/hooks/useNav.js`** — expose `dataAccess: resolved?.data_access ?? []` alongside `navItems`/`menuItems` (reusing `findDomainSource` from `src/helpers/formatting.js`, same as before).
3. **`src/App.jsx`** — this is the structural change: since there's no page to route to, `DailyTrackingPage` would need to render directly once `ready` is true, replacing the current `activeItem`-driven `PageContent` rendering for this app — essentially what `SAMPLE_MODE` used to do, but permanently and for real, not as a bypass.
4. **`DailyTrackingPage.jsx`** — already accepts a `domainSources` prop and calls `findDomainSource` internally, so its own logic doesn't change. Only the *source* of that prop changes: from `PageContent`'s page-level `domainSources` to `App.jsx`'s app-level `dataAccess`.
5. **`PageContent/index.jsx`** — the `DAILY_TRACKING_PAGE_SLUG` branch becomes dead code and could be removed.

## Recommendation

Given the page-level version is already built, published, and verified end-to-end (real projects/operators/equipment showing up in your screenshots), switching to app-level would mean giving up normal page navigation for no functional difference in the data itself — same `data_access` shape, same resolve mechanism, same permission model. I'd only switch if you're planning multiple pages that all need these same 3 domains and want to declare the connection once. Otherwise, what's already running is the more standard, less disruptive path.
