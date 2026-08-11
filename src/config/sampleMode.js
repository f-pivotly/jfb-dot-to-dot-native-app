// Temporary bypass: renders DailyTrackingPage directly instead of waiting on
// a real Pivotly parent handshake + backend nav registration. Now false —
// the apg-jfb-dot-to-dot-daily-event page/nav entry is registered and
// published server-side, so the app should go through the real
// nav -> page-resolve -> data_access flow instead of this shortcut. Flip
// back to true only for structural/visual testing with no real session.
export const SAMPLE_MODE = false;
