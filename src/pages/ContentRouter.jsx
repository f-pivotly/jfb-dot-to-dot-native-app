import DailyTrackingPage from "./dailyTracking/DailyTrackingPage";

export default function PageContent({ pageData }) {
  if (!pageData) return null;

  const inner = pageData?.data || pageData;
  const { data_access } = inner ?? {};

  const domainSources = (
    Array.isArray(data_access) ? data_access : [data_access]
  ).filter((s) => s?.source_type === "domain" && s?.domain);

  return <DailyTrackingPage domainSources={domainSources} />;
}
