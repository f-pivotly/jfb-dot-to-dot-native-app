import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Box, Text, Loader, Center } from "@mantine/core";
import PageContent from "./pages/ContentRouter";
import DailyTrackingPage from "./pages/dailyTracking/DailyTrackingPage";

import { useNav } from "./hooks/useNav";
import { usePageDetails } from "./hooks/usePageDetails";
import { useAppConfig } from "./contexts/pivotlyAppConfigContext";
import { usePicklistCatalog } from "./hooks/usePicklistCatalog";
import { REQUIRED_PICKLISTS } from "./config/requiredPicklists";

function BootNotice({ loading, message, detail }) {
  return (
    <Center
      style={{
        height: "100vh",
        flexDirection: "column",
        gap: loading ? 12 : 8,
        background: "#141414",
      }}
    >
      {loading && <Loader color="red" size="sm" />}
      <Text size="xs" c={loading ? "#666" : "#ef4444"} fw={loading ? 400 : 600}>
        {message}
      </Text>
      {detail && (
        <Text size="xs" c="#666" ta="center" maw={420}>
          {detail}
        </Text>
      )}
    </Center>
  );
}

export default function App() {
  const { pathname } = useLocation();
  const { ready, error: configError, fromCache: configFromCache } = useAppConfig();
  const { loading: picklistsLoading, missing: missingPicklists } = usePicklistCatalog(REQUIRED_PICKLISTS);

  const { menuItems, defaultItem, dataAccess, fromCache: navFromCache } = useNav();
  const { pageData, slug, loadPage, fromCache: pageFromCache } = usePageDetails();

  const usingCachedShell = configFromCache || navFromCache || pageFromCache;

  const activeItem = menuItems.find((n) => n.path === pathname) ?? defaultItem ?? null;
  const resolvedSlug = activeItem?.page_slug ?? null;

  const hasShellDataAccess = dataAccess.some((s) => s?.source_type === "domain" && s?.domain);

  useEffect(() => {
    if (resolvedSlug && !slug) loadPage(resolvedSlug);
  }, [resolvedSlug, slug, loadPage]);

  if (!ready && !configError) {
    return <BootNotice loading message="Waiting for configuration…" />;
  }

  if (configError) {
    return <BootNotice message="Configuration error" detail={configError} />;
  }

  if (picklistsLoading) {
    return <BootNotice loading message="Loading picklist catalog…" />;
  }

  if (missingPicklists.length > 0) {
    return (
      <BootNotice
        message="Configuration error — missing required picklists"
        detail={missingPicklists.join(", ")}
      />
    );
  }

  let mainContent;
  if (activeItem) {
    mainContent = <PageContent pageData={pageData} />;
  } else if (hasShellDataAccess) {
    mainContent = <DailyTrackingPage domainSources={dataAccess} />;
  } else {
    mainContent = (
      <Box
        style={{
          height: "80vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: 24,
          fontWeight: "bold",
          opacity: 0.7,
        }}
      >
        Select navigation item above
      </Box>
    );
  }

  return (
    <Box
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "'Inter', -apple-system, sans-serif",
        fontSize: 13,
      }}
    >
      {usingCachedShell && (
        <Box
          py={4}
          style={{
            textAlign: "center",
            fontSize: 11,
            fontWeight: 600,
            color: "#92400e",
            background: "#fef3c7",
            borderBottom: "1px solid #fde68a",
            flexShrink: 0,
          }}
        >
          Offline — showing cached data
        </Box>
      )}

      {mainContent}
    </Box>
  );
}
