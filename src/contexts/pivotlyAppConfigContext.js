import { createContext, useContext } from "react";

export const AppConfigContext = createContext(null);

export const MSG = {
  APP_READY: "PIVOTLY_APP_READY",
  REFRESH_AUTH_TOKEN: "PIVOTLY_REFRESH_AUTH_TOKEN",
  APP_CONFIG: "PIVOTLY_APP_CONFIG",
  AUTH_TOKEN_UPDATED: "PIVOTLY_AUTH_TOKEN_UPDATED",
};

export function useAppConfig() {
  const ctx = useContext(AppConfigContext);
  if (!ctx)
    throw new Error(
      "useAppConfig must be used within PivotlyAppConfigProvider",
    );
  return ctx;
}
