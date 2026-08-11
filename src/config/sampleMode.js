// Temporary bypass: renders DailyTrackingPage directly with static sample
// data instead of waiting on a real Pivotly parent handshake + backend nav
// registration (neither exists yet for this page). Flip to false once the
// apg-ofa_daily_event page/nav entry is registered server-side — everything
// else (App.jsx, PivotlyAppConfigContext, offlineDb) is untouched either way.
export const SAMPLE_MODE = true;
