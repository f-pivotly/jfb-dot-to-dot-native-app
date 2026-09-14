import { useState, useEffect } from "react";
import { fetchAppResolve } from "../data";
import { useAppConfig } from "../contexts/pivotlyAppConfigContext";
import { getShellCache, setShellCache } from "../data/offlineDb";

const SHELL_CACHE_KEY = "nav";
const PAGE_SLUG = "apg-jfb-dot-to-dot-daily-event";

export function useAppShell() {
  const { config } = useAppConfig();
  const [pages, setPages] = useState([]);
  const [dataAccess, setDataAccess] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    if (!config.appSlug) return;
    fetchAppResolve(config.appSlug)
      .then((resolved) => {
        const resolvedPages = resolved?.app?.pages ?? [];
        const access = resolved?.data_access ?? [];
        setPages(resolvedPages);
        setDataAccess(access);
        setFromCache(false);
        setShellCache(SHELL_CACHE_KEY, { pages: resolvedPages, dataAccess: access });
      })
      .catch((err) =>
        getShellCache(SHELL_CACHE_KEY).then((cached) => {
          if (cached?.pages?.length || cached?.dataAccess?.length) {
            setPages(cached.pages ?? []);
            setDataAccess(cached.dataAccess ?? []);
            setFromCache(true);
          } else {
            setError(err.message);
          }
        }),
      )
      .finally(() => setLoading(false));
  }, [config.appSlug]);

  const page = pages.find((p) => p.page_slug === PAGE_SLUG) ?? null;

  return { page, dataAccess, loading, error, fromCache };
}
