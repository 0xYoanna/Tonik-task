import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { ReportProvider } from "./state/useReport.js";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ReportProvider>
      <App />
    </ReportProvider>
  </StrictMode>,
);
