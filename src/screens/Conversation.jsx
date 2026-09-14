import { ArrowLeft, FileCheck2, PanelRightOpen, Zap } from "lucide-react";
import { useReport } from "../state/useReport.js";
import { shiftNow } from "../lib/clock.js";
import Thread from "../components/Thread.jsx";
import Composer from "../components/Composer.jsx";
import ReportPreview from "../components/ReportPreview.jsx";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/* Two conversations, one surface.

   QUICK — mid-shift. The manager is standing up with a radio in
   their hand. Time is now, the camera is flagged automatically,
   and it lets them go after one exchange. Everything else waits.

   REPORT — end of shift. Opens holding whatever was logged as it
   happened, picks up the details that were deferred, then signs
   the night off. Nothing is ever narrated twice. */

export default function Conversation() {
  const report = useReport();
  const quick = report.mode === "quick";

  return (
    <>
      <header className="flex items-center gap-2.5 border-b bg-card px-6 py-3">
        <Button variant="ghost" size="sm" onClick={report.toDashboard}>
          <ArrowLeft />
          Dashboard
        </Button>

        <div className="ml-1 flex items-center gap-2">
          {quick ? (
            <>
              <Zap className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Quick log</span>
              <Badge variant="secondary" className="tabular-nums">
                {shiftNow()}
              </Badge>
            </>
          ) : (
            <>
              <FileCheck2 className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Shift report</span>
            </>
          )}
        </div>

        <div className="flex-1" />

        <span className="text-xs text-muted-foreground">
          {quick
            ? "Logged now, details at close"
            : report.incomplete.length
              ? `${report.incomplete.length} to finish`
              : `${report.logged.length} logged`}
        </span>

        {!quick && !report.showReport && (
          <Button size="sm" variant="ghost" onClick={report.toggleReport}>
            <PanelRightOpen />
            Show report
          </Button>
        )}

        {quick ? (
          <Button size="sm" variant="outline" onClick={report.toDashboard}>
            Done
          </Button>
        ) : (
          report.logged.length > 0 && (
            <Button size="sm" onClick={report.toSummary}>
              Sign off
            </Button>
          )
        )}
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto">
            <Thread />
          </div>
          <Composer />
        </div>

        {/* Live document, hideable if it's more distracting than
            reassuring. Quick logs never show it — one exchange
            doesn't need a document beside it. */}
        {!quick && report.showReport && <ReportPreview />}
      </div>
    </>
  );
}
