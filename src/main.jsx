import ReactDOM from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "./theme/fonts.css";
import { theme } from "./theme";
import App from "./App";
import { PivotlyAppConfigProvider } from "./contexts/PivotlyAppConfigProvider";

ReactDOM.createRoot(document.getElementById("root")).render(
  <MantineProvider theme={theme} defaultColorScheme="light">
    <PivotlyAppConfigProvider>
      <App />
    </PivotlyAppConfigProvider>
  </MantineProvider>,
);
