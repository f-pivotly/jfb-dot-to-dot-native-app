# Loading Daily Tracking automatically — no nav bar needed

**Status: both options below are now implemented.** They coexist in the same codebase — which one actually runs depends entirely on whether the app being resolved has pages of its own:
- `ofa-person` has a real page (`apg-jfb-dot-to-dot-daily-event`) → Option A path (auto-select + auto-load it)
- `ofa-test-app` has zero pages but has `projects`/`operators`/`equipments` connected at the app-shell level → Option B path (renders `DailyTrackingPage` directly from `App.jsx`, fed by the app-level `data_access`)

Originally this doc proposed Option A as the smaller change and Option B as an alternative. Both turned out to be needed once it became clear `ofa-test-app` was already set up app-level-only with no pages at all — Option A's auto-select has nothing to select there.

## Option A (implemented) — auto-select the existing page, no architecture change

Everything already built — the page, its `data_access`, the real domain fetching in `DailyTrackingPage.jsx` — stays exactly as-is and already verified working. The only gap is that nothing currently *triggers* loading that page automatically; it only loads on a nav click (`handleNav` in `src/App.jsx:137-140`).

Two small additions close that gap:

1. **`src/hooks/useNav.js:42`** — `defaultItem` is already a return value of this hook, just hardcoded to `null`:
   ```js
   const defaultItem = null;
   ```
   Change it to find the Daily Tracking entry once `menuItems` resolves:
   ```js
   const defaultItem = menuItems.find((n) => n.page_slug === 'apg-jfb-dot-to-dot-daily-event') ?? null;
   ```

2. **`src/App.jsx`** — `activeItem` already falls back to `defaultItem` (`src/App.jsx:132-133`), so once step 1 lands, `activeItem`/`resolvedSlug` resolve correctly without a click. But nothing calls `loadPage(resolvedSlug)` except `handleNav`. Add one effect near the other hooks to fire it once, automatically:
   ```js
   useEffect(() => {
     if (resolvedSlug && !slug) loadPage(resolvedSlug);
   }, [resolvedSlug, slug, loadPage]);
   ```
   (guarded by `!slug` so it only fires once, not on every render)

3. **Hide the tab row** (optional, since there's only one meaningful destination now) — `AppHeader` already conditionally renders nav items; simplest is to only pass it real items when there's more than one, e.g. in `App.jsx`: `menuItems={menuItems.length > 1 ? menuItems : []}`.

That's it. `Core_Independent`, `Portal_Independent_Backend`, `Portal_Independent_Frontend` — **no changes**, same as before; this is purely a `jfb-dot-to-dot-native-app` change, and a small one.

## Option B (implemented) — app-level data access as a fallback when there's no page

Connects `projects`/`operators`/`equipments` on the **app** shell (`runtime_services.data`, set via the App Editor's "Data Sources" tab — already done for `ofa-test-app`) instead of on a page. Rather than replacing the page/nav system outright, it was added as a **fallback branch** in `App.jsx`: if there's no `activeItem` (no page resolved a nav destination) but the app-level `data_access` has real domain entries, render `DailyTrackingPage` directly from there. `ofa-person` (which has a page) is unaffected — it still takes the Option A path.

Verified against the real stored-procedure source in `Core_Independent/src/sql/00108-pivotly_native_apps/`:
- `1300-fnc_app_resolve.sql` — already resolves `runtime_services.data` into a top-level `data_access` array on every app resolve
- `1240-fnc_app_data_access_resolve_array.sql` / `1210-fnc_app_domain_access_resolve.sql` — already do the per-domain resolution, identically to the page-level path

No changes to `Core_Independent` or `Portal_Independent_Backend` (`cfgItemSaveService`/`nativeAppService.publishApp` already handled it), and no changes to `Portal_Independent_Frontend` (the App Editor's "Data Sources" tab already did this — pure data entry, same as how the page was created by hand).

`jfb-dot-to-dot-native-app` changes made:
1. `src/data/index.js` — `fetchNavItems` (returned only `data?.data?.app?.pages`) replaced with `fetchAppResolve`, returning the full `data.data` payload (`app`, `data_access`, `claims`, `actions`)
2. `src/hooks/useNav.js` — now also returns `dataAccess` from the resolved payload, cached alongside `navItems` in the same offline-cache entry
3. `src/App.jsx` — `activeItem`/`resolvedSlug` moved above the early-return blocks (required, so the new auto-load effect can reference them without violating rules-of-hooks); added `hasShellDataAccess` check; main content is now `activeItem ? <PageContent/> : hasShellDataAccess ? <DailyTrackingPage domainSources={dataAccess}/> : <"Select navigation item">`
4. `DailyTrackingPage.jsx` — no change; already just consumes a `domainSources` array via `findDomainSource`, regardless of whether it came from a page or the app shell
5. `PageContent/index.jsx` — `DAILY_TRACKING_PAGE_SLUG` branch left in place (still used by `ofa-person`)

## Outcome

Both paths now coexist, selected automatically per app_slug — no manual switching needed. `ofa-person` uses its page; `ofa-test-app` (or any future app with domains connected at the shell level but no pages) falls through to the app-level path.
