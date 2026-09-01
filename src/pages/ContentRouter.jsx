import { Box, Text, Loader, Center } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import SafeError from "../components/SafeError";
import DailyTrackingPage from "./dailyTracking/DailyTrackingPage";

export default function PageContent({
  pageData,
  loading,
  error,
  slug,
  onRetry,
}) {
  const inner = pageData?.data || pageData;
  const { data_access, actions } = inner ?? {};

  if (!pageData) return null;

  if (!slug && !loading) {
    return (
      <Center
        style={{
          flex: 1,
          flexDirection: "column",
          gap: 10,
          background: "#f7f7f7",
        }}
      >
        <Text size="sm" c="#ccc" fw={600}>
          Select a page from the navigation
        </Text>
      </Center>
    );
  }

  if (loading) {
    return (
      <Center
        style={{
          flex: 1,
          flexDirection: "column",
          gap: 12,
          background: "#f7f7f7",
        }}
      >
        <Loader color="red" size="sm" />
        <Text size="xs" c="#aaa">
          Loading page details for <strong>{slug}</strong>…
        </Text>
      </Center>
    );
  }

  if (error) {
    return (
      <Center
        style={{
          flex: 1,
          flexDirection: "column",
          gap: 10,
          background: "#f7f7f7",
        }}
      >
        <Text size="sm" c="#ef4444" fw={600}>
          Failed to load page
        </Text>
        <SafeError message={error} c="#aaa" />
        <Box
          onClick={onRetry}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 12,
            color: "#dc2626",
            cursor: "pointer",
            marginTop: 4,
          }}
        >
          <IconRefresh size={13} /> Retry
        </Box>
      </Center>
    );
  }

  const domainSources = (
    Array.isArray(data_access) ? data_access : [data_access]
  ).filter((s) => s?.source_type === "domain" && s?.domain);

  return <DailyTrackingPage domainSources={domainSources} actions={actions} />;
}
