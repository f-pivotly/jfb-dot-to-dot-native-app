import { useState, useEffect } from "react";
import { fetchAppResolve } from "../data";
import { useAppConfig } from "../contexts/appConfigContext";
import { getShellCache, setShellCache } from "../data/offlineDb";

const NAV_CACHE_KEY = "nav";

export function useNav() {
  const { config } = useAppConfig();
  const [navItems, setNavItems] = useState([]);
  const [dataAccess, setDataAccess] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    if (!config.appSlug) return;
    fetchAppResolve(config.appSlug)
      .then((resolved) => {
        const pages = resolved?.app?.pages ?? [];
        const access = resolved?.data_access ?? [];
        setNavItems(pages);
        setDataAccess(access);
        setFromCache(false);
        setShellCache(NAV_CACHE_KEY, { pages, dataAccess: access });
      })
      .catch((err) =>
        getShellCache(NAV_CACHE_KEY).then((cached) => {
          if (cached?.pages?.length || cached?.dataAccess?.length) {
            setNavItems(cached.pages ?? []);
            setDataAccess(cached.dataAccess ?? []);
            setFromCache(true);
          } else {
            setError(err.message);
          }
        }),
      )
      .finally(() => setLoading(false));
  }, [config.appSlug]);

  const apiMenuItems = navItems.filter((n) => n.show_in_menu && n.visible);

  const menuItems = [...apiMenuItems].sort(
    (a, b) => a.display_order - b.display_order,
  );

  const defaultItem = menuItems.find((n) => n.page_slug === 'apg-jfb-dot-to-dot-daily-event') ?? null;

  return { navItems, menuItems, defaultItem, dataAccess, loading, error, fromCache };
}
