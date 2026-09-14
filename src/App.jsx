import { useReport } from "./state/useReport.js";
import Shell from "./components/Shell.jsx";
import Conversation from "./screens/Conversation.jsx";
import Dashboard from "./screens/Dashboard.jsx";
import Submit from "./screens/Submit.jsx";

/* You land on the shift dashboard. "Log an incident" is the only
   control that leads anywhere further — it opens the
   conversation, which ends at sign-off. */

export default function App() {
  const report = useReport();

  return (
    <Shell>
      {report.phase === "dashboard" ? (
        <div className="flex-1 overflow-y-auto">
          <Dashboard />
        </div>
      ) : report.phase === "quick" || report.phase === "report" ? (
        <Conversation />
      ) : (
        <div className="flex-1 overflow-y-auto">
          <Submit />
        </div>
      )}
    </Shell>
  );
}
