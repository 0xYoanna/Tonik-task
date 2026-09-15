import {
  AlertTriangle, CalendarClock, Camera, CheckCircle2, ChevronRight, CircleAlert,
  ClipboardList, FileText, Package, Plus, Users, Wrench,
} from "lucide-react";
import { useReport } from "../state/useReport.js";
import {
  venue, shift, onShift, guests, tasks, inventory,
  privateEvents, maintenance, reportHistory,
} from "../data/sampleShift.js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

/* The shift at a glance, before anything is written.

   Everything here is read-only except Log Incident. Stock shadcn
   has no warning or success colour, so state is carried by an
   ICON PLUS A LABEL rather than by hue alone — which is also the
   accessible way round.

   No charts: these are headline numbers and lists. A one-bar bar
   chart of "212 guests" would be a chart pretending to be a fact. */

const initials = (n) => n.split(" ").map((p) => p[0]).join("").slice(0, 2);

/* Status → an icon and a stock badge variant. Never colour alone. */
const STATE = {
  ok: { icon: CheckCircle2, variant: "outline", label: "OK" },
  low: { icon: CircleAlert, variant: "secondary", label: "Low" },
  out: { icon: AlertTriangle, variant: "destructive", label: "Out" },
  open: { icon: CircleAlert, variant: "secondary", label: "Open" },
  escalated: { icon: AlertTriangle, variant: "destructive", label: "Escalated" },
  logged: { icon: ClipboardList, variant: "outline", label: "Logged" },
  running: { icon: CalendarClock, variant: "default", label: "Happening now" },
  finished: { icon: CheckCircle2, variant: "outline", label: "Finished" },
  upcoming: { icon: CalendarClock, variant: "secondary", label: "Not started" },
};

function State({ state }) {
  const s = STATE[state] ?? STATE.logged;
  const Icon = s.icon;
  return (
    <Badge variant={s.variant}>
      <Icon />
      {s.label}
    </Badge>
  );
}

/* Stat tile: label in sentence case, value in proportional
   figures — tabular-nums is for columns, not display numbers. */
function Stat({ icon: Icon, label, value, sub }) {
  return (
    <Card className="gap-0 py-4">
      <CardContent className="px-4">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="size-3.5" />
          <span className="text-xs font-medium">{label}</span>
        </div>
        <div className="mt-1.5 text-2xl font-semibold">{value}</div>
        {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function Panel({ id, icon: Icon, title, description, children, footer }) {
  return (
    <Card id={id} className="scroll-mt-6 gap-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className="size-4 text-muted-foreground" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer}
    </Card>
  );
}

export default function Dashboard() {
  const report = useReport();
  const done = tasks.filter((t) => t.done).length;
  const openIssues = maintenance.filter((m) => m.status !== "closed").length;
  const live = privateEvents.filter((e) => e.status === "running").length;
  const lowStock = inventory.filter((i) => i.status !== "ok").length;

  return (
    <div id="dash-top" className="mx-auto w-full max-w-6xl px-8 py-8">
      {/* ── Shift header ─────────────────────────────────── */}
      <header className="flex flex-wrap items-start gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{venue.name}</h1>
            <Badge variant="secondary">{shift.status}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {venue.date} · {venue.hours} · last call {shift.lastCall} · cleared{" "}
            {shift.clearedAt}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Duty manager <span className="text-foreground">{shift.dutyManager}</span>{" "}
            since {shift.onShiftSince} · DPS {shift.dps} · licence {venue.licence}
          </p>
        </div>

        {/* The one number the view leads with. */}
        <div className="ml-auto text-right">
          {/* At close the number that matters is the night's
              total, not the live count — the room is empty. */}
          <div className="text-xs font-medium text-muted-foreground">
            Admitted tonight
          </div>
          <div className="text-5xl leading-none font-semibold">{guests.admitted}</div>
          <div className="mt-2 w-44">
            <Progress value={(guests.peak / guests.capacity) * 100} />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>peak {guests.peak} of {guests.capacity}</span>
              <span>{Math.round((guests.peak / guests.capacity) * 100)}%</span>
            </div>
          </div>
          <div className="mt-1.5 text-xs text-muted-foreground tabular-nums">
            Venue cleared {shift.clearedAt} · none inside
          </div>
        </div>
      </header>

      <Separator className="my-6" />

      {/* ── KPI row ──────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={Users}
          label="Refused at the door"
          value={guests.refused}
          sub={`Peak ${guests.peak} at ${guests.peakAt} · none inside now`}
        />
        <Stat
          icon={ClipboardList}
          label="Closing tasks"
          value={`${done}/${tasks.length}`}
          sub={`${tasks.length - done} still to do`}
        />
        <Stat
          icon={Wrench}
          label="Maintenance"
          value={openIssues}
          sub={`${maintenance.filter((m) => m.severity === "high").length} high priority`}
        />
        <Stat
          icon={CalendarClock}
          label="Private events"
          value={privateEvents.length}
          sub={live ? `${live} happening now` : "None running now"}
        />
      </div>

      {/* ── The two main sections ────────────────────────── */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card id="dash-reports" className="scroll-mt-6 gap-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="size-4 text-muted-foreground" />
              Reports
            </CardTitle>
            <CardDescription>Filed shift reports for this venue</CardDescription>
            <CardAction>
              <Button size="sm" variant="outline" onClick={report.addReport}>
                <Plus />
                Add report
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Night</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead className="text-right">Incidents</TableHead>
                  <TableHead className="text-right">Guests</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportHistory.map((r) => (
                  <TableRow key={r.date}>
                    <TableCell className="font-medium">{r.date}</TableCell>
                    <TableCell className="text-muted-foreground">{r.manager}</TableCell>
                    {/* tabular-nums here: these are columns that must align */}
                    <TableCell className="text-right tabular-nums">{r.incidents}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.guests}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* The only live control on this screen. */}
        <Card id="dash-incidents" className="scroll-mt-6 gap-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="size-4 text-muted-foreground" />
              Incidents
            </CardTitle>
            <CardDescription>
              Anything that belongs in the statutory register
            </CardDescription>
          </CardHeader>
          <CardContent className="flex h-full flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl leading-none font-semibold">
                {report.logged.length}
              </span>
              <span className="text-sm text-muted-foreground">logged tonight</span>
            </div>

            {report.logged.length === 0 ? (
              <p className="mt-3 max-w-sm text-sm text-muted-foreground">
                Something happen? Say it in one line. It stamps the time, names
                the camera, flags the window before that footage overwrites
                itself — and asks for the rest at close.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {report.logged.map((i) => (
                  <li key={i.id} className="flex items-center gap-2 text-sm">
                    <span className="tabular-nums text-muted-foreground">
                      {i.occurredAt}
                    </span>
                    <span className="flex-1 truncate">
                      {i.typeLabel}
                      {i.location ? ` · ${i.location}` : ""}
                    </span>
                    {i.preservation && (
                      <Badge variant="outline">
                        <Camera />
                        {i.preservation.camera}
                      </Badge>
                    )}
                    {!i.full && <Badge variant="secondary">Details at close</Badge>}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-auto flex flex-wrap gap-2 pt-5">
              <Button size="lg" onClick={report.logIncident}>
                Log an incident
                <ChevronRight />
              </Button>
              {report.logged.length > 0 && (
                <Button size="lg" variant="outline" onClick={report.addReport}>
                  Finish the shift report
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Everything else, read-only ───────────────────── */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel icon={Users} title="On shift" description={`${onShift.filter((p) => p.status === "on").length} of ${onShift.length} still here`}>
          <ul className="space-y-2.5">
            {onShift.map((p) => (
              <li key={p.name} className="flex items-center gap-2.5">
                <Avatar className="size-7">
                  <AvatarFallback className="text-xs">{initials(p.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.role} · in {p.in}
                  </div>
                </div>
                {p.status === "left" && <Badge variant="outline">Left</Badge>}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          id="dash-tasks" icon={ClipboardList} title="Tasks log" description={`${done} of ${tasks.length} complete`}>
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li key={t.label} className="flex items-center gap-2">
                {t.done ? (
                  <CheckCircle2 className="size-3.5 shrink-0 text-muted-foreground" />
                ) : (
                  <CircleAlert className="size-3.5 shrink-0 text-muted-foreground" />
                )}
                <span className={`flex-1 text-sm ${t.done ? "text-muted-foreground line-through" : ""}`}>
                  {t.label}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {t.at ?? t.owner.split(" ")[0]}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          id="dash-inventory" icon={Package} title="Inventory" description={lowStock ? `${lowStock} need attention` : "All stocked"}>
          <ul className="space-y-2.5">
            {inventory.map((i) => (
              <li key={i.item} className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{i.item}</div>
                  <div className="text-xs text-muted-foreground">{i.level}</div>
                </div>
                <State state={i.status} />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          id="dash-events" icon={CalendarClock} title="Private events" description="Closed events booked tonight" >
          <ul className="space-y-3">
            {privateEvents.map((e) => (
              <li key={e.name}>
                <div className="flex items-center gap-2">
                  <span className="flex-1 truncate text-sm">{e.name}</span>
                  <State state={e.status} />
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                  {e.room} · {e.from}–{e.to} · {e.guests} guests
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          id="dash-maintenance"
          icon={Wrench}
          title="Maintenance issues"
          description={`${openIssues} open`}
          footer={
            <CardContent>
              <p className="text-xs text-muted-foreground">
                An equipment fault with a safety implication becomes an incident if
                someone gets hurt. Log it on the left if it does.
              </p>
            </CardContent>
          }
        >
          <ul className="space-y-3">
            {maintenance.map((m) => (
              <li key={m.issue}>
                <div className="flex items-start gap-2">
                  <span className="flex-1 text-sm">{m.issue}</span>
                  <State state={m.status} />
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                  {m.location} · reported {m.reported} · {m.severity} priority
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel icon={Users} title="Door" description="Entry activity tonight">
          <dl className="space-y-2.5 text-sm">
            {[
              ["Admitted", guests.admitted],
              ["Inside now", `${guests.inside} — cleared ${shift.clearedAt}`],
              ["Peak occupancy", `${guests.peak} at ${guests.peakAt}`],
              ["Refused entry", guests.refused],
              ["Capacity", guests.capacity],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
    </div>
  );
}
