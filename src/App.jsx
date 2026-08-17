import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Box, Text, Loader, Center } from "@mantine/core";
import PageContent from "./pages/PageContent";
import DailyTrackingPage from "./pages/PageContent/dailyTracking/DailyTrackingPage";

import { useNav } from "./hooks/useNav";
import { usePageDetails } from "./hooks/usePageDetails";
import { useAppConfig } from "./contexts/pivotlyAppConfigContext";
import { usePicklistCatalog } from "./hooks/usePicklistCatalog";
import { REQUIRED_PICKLISTS } from "./config/requiredPicklists";
import { SAMPLE_MODE } from "./config/sampleMode";

export default function App() {
  const { pathname } = useLocation();
  const { ready, error: configError, fromCache: configFromCache } = useAppConfig();
  const { loading: picklistsLoading, missing: missingPicklists } = usePicklistCatalog(REQUIRED_PICKLISTS);

  const { menuItems, defaultItem, dataAccess, fromCache: navFromCache } = useNav();
  const {
    pageData,
    loading: pageLoading,
    error: pageError,
    slug,
    loadPage,
    fromCache: pageFromCache,
  } = usePageDetails();

  const usingCachedShell = configFromCache || navFromCache || pageFromCache;

  const activeItem = menuItems.find((n) => n.path === pathname) ?? defaultItem ?? null;
  const resolvedSlug = activeItem?.page_slug ?? null;

  const hasShellDataAccess = dataAccess.some((s) => s?.source_type === "domain" && s?.domain);

  useEffect(() => {
    if (resolvedSlug && !slug) loadPage(resolvedSlug);
  }, [resolvedSlug, slug, loadPage]);

  if (SAMPLE_MODE) {
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
        <DailyTrackingPage />
      </Box>
    );
  }

  if (!ready && !configError) {
    return (
      <Center
        style={{
          height: "100vh",
          flexDirection: "column",
          gap: 12,
          background: "#141414",
        }}
      >
        <Loader color="red" size="sm" />
        <Text size="xs" c="#666">
          Waiting for configuration…
        </Text>
      </Center>
    );
  }

  if (configError) {
    return (
      <Center
        style={{
          height: "100vh",
          flexDirection: "column",
          gap: 8,
          background: "#141414",
        }}
      >
        <Text size="xs" c="#ef4444" fw={600}>
          Configuration error
        </Text>
        <Text size="xs" c="#666">
          {configError}
        </Text>
      </Center>
    );
  }

  if (picklistsLoading) {
    return (
      <Center
        style={{
          height: "100vh",
          flexDirection: "column",
          gap: 12,
          background: "#141414",
        }}
      >
        <Loader color="red" size="sm" />
        <Text size="xs" c="#666">
          Loading picklist catalog…
        </Text>
      </Center>
    );
  }

  if (missingPicklists.length > 0) {
    return (
      <Center
        style={{
          height: "100vh",
          flexDirection: "column",
          gap: 8,
          background: "#141414",
        }}
      >
        <Text size="xs" c="#ef4444" fw={600}>
          Configuration error — missing required picklists
        </Text>
        <Text size="xs" c="#666" ta="center" maw={420}>
          {missingPicklists.join(", ")}
        </Text>
      </Center>
    );
  }

  function handleRetry() {
    if (resolvedSlug) loadPage(resolvedSlug);
  }

  let mainContent;
  if (activeItem) {
    mainContent = (
      <PageContent
        pageData={pageData}
        loading={pageLoading}
        error={pageError}
        slug={slug}
        onRetry={handleRetry}
      />
    );
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
