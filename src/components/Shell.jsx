import { useState } from "react";
import {
  AlertTriangle, CalendarClock, ClipboardList, FileText, Home,
  LogOut, Package, Wrench,
} from "lucide-react";
import { venue, shift } from "../data/sampleShift.js";
import { useReport } from "../state/useReport.js";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

/* App navigation, mirroring the dashboard's own sections.

   Every item lands on the matching panel of the shift dashboard.
   Only Incidents leads anywhere further, and only through the
   "Log an incident" button once you're there. */

const NAV = [
  { key: "home", label: "Home", icon: Home },
  { key: "reports", label: "Reports", icon: FileText },
  { key: "incidents", label: "Incidents", icon: AlertTriangle },
  { key: "tasks", label: "Tasks", icon: ClipboardList },
  { key: "inventory", label: "Inventory", icon: Package },
  { key: "events", label: "Events", icon: CalendarClock },
  { key: "maintenance", label: "Maintenance", icon: Wrench },
];

const initials = (n) => n.split(" ").map((p) => p[0]).join("").slice(0, 2);

export default function Shell({ children }) {
  const report = useReport();
  const [active, setActive] = useState("home");

  const go = (key) => {
    setActive(key);
    report.toDashboard();
    // let the dashboard mount before scrolling to the panel
    requestAnimationFrame(() => {
      if (key === "home") {
        document.getElementById("dash-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      document.getElementById(`dash-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <nav className="flex w-60 shrink-0 flex-col border-r bg-card">
        <div className="px-4 py-3.5">
          <div className="text-sm font-semibold">{venue.name}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {venue.date} · {shift.status}
          </div>
        </div>

        <Separator />

        <div className="flex-1 overflow-y-auto p-2">
          {NAV.map((item) => {
            const Icon = item.icon;
            const on = active === item.key && report.phase === "dashboard";
            return (
              <button
                key={item.key}
                onClick={() => go(item.key)}
                className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition ${
                  on
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.key === "incidents" && report.logged.length > 0 && (
                  <span className="rounded-md bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground tabular-nums">
                    {report.logged.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <Separator />

        {/* Who's signed in, and the way out. */}
        <div className="p-3">
          <div className="flex items-center gap-2.5">
            <Avatar className="size-8">
              <AvatarFallback className="text-xs">
                {initials(venue.manager)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{venue.manager}</div>
              <div className="truncate text-xs text-muted-foreground">
                Duty manager
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start text-muted-foreground"
            onClick={() => {
              report.reset();
              setActive("home");
            }}
            title="Ends the session and clears tonight's draft"
          >
            <LogOut />
            Log out
          </Button>
        </div>
      </nav>

      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
