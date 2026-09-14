import ReactDOM from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./theme/fonts.css";
import { theme } from "./theme";
import App from "./App";
import { PivotlyAppConfigProvider } from "./contexts/PivotlyAppConfigProvider";

ReactDOM.createRoot(document.getElementById("root")).render(
  <MantineProvider theme={theme} defaultColorScheme="light">
    <Notifications position="top-center" limit={3} containerWidth={420} />
    <PivotlyAppConfigProvider>
      <App />
    </PivotlyAppConfigProvider>
  </MantineProvider>,
);
