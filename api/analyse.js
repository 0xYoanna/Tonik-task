/* ─────────────────────────────────────────────────────────────
   THE REAL AI
   Server-side because an API key cannot live in client code.

   WHAT THIS REPLACES: reading the manager's words — classifying
   the message, extracting incident fields, spotting which report
   sections were touched.

   WHAT IT DOES NOT TOUCH: what gets asked next, the severity
   gate, the question order, and the rule that a person is never
   named by the machine. Those are product decisions and they stay
   deterministic in src/lib/conversation.js. The model swaps out
   detection, not the design.
   ───────────────────────────────────────────────────────────── */

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

const Incident = z.object({
  type: z.string().describe(
    "One of: injury, assault, drugs, weapon, medical, fire, ejection, " +
      "refusal_entry, refusal_service, id_failure, theft, damage, noise, " +
      "counterfeit, indecent, capacity, equipment, other. Use 'other' when " +
      "something clearly happened but no category fits.",
  ),
  occurredAt: z.string().describe(
    "24h HH:MM if the manager stated or clearly implied a time. Empty string " +
      "if not stated — NEVER infer or invent a time.",
  ),
  location: z.string().describe(
    "Must be copied exactly from the venue floorplan list, or empty string " +
      "if the manager didn't say where. Never guess a location.",
  ),
  description: z.string().describe("The manager's own words, verbatim."),
});

const Analysis = z.object({
  kind: z.enum(["incident", "section_note", "nothing", "off_topic"]).describe(
    "incident = something for the statutory register. section_note = about " +
      "the shift but not an incident (bar, staff, stock, maintenance). " +
      "nothing = they said nothing happened. off_topic = a request aimed at " +
      "the assistant that has nothing to do with the venue.",
  ),
  incidents: z.array(Incident),
  sections: z.array(z.string()).describe(
    "Report sections this touches, from: overview, incidents, audience, " +
      "security, artists, door, production, bar, kitchen, vendors, private, " +
      "maintenance, inventory.",
  ),
  reasoning: z.string().describe("One short sentence. Shown to nobody; for logs."),
});

const SYSTEM = `You read what a nightclub duty manager says at the end of, or during, a shift, and turn it into structured records for a statutory incident register.

You are not a general assistant. You only handle tonight's shift. If asked anything else — weather, jokes, general knowledge, writing help — return kind "off_topic" and nothing else.

Hard rules, in order of importance:

1. NEVER invent a time or a location. If the manager didn't say it, return an empty string. A fabricated timestamp in a document an insurer may read is worse than a gap. A blank beats a guess, always.
2. NEVER name or describe a person in any field. You classify events, not people. If the manager names someone, that is their act, not yours — keep it only inside the verbatim description.
3. Locations must come from the venue's floorplan list, copied exactly. If what they said doesn't match one, return an empty string.
4. One sentence can contain several incidents. An enumerated list ("refused at 22:10, 22:25, 22:40") is several records, not one.
5. Negation matters. "Nobody was hurt" is not an injury. "Neither wanted police" is not police attendance.
6. Lost property, staff no-shows, delivery shortfalls and a broken glass with nobody hurt are NOT incidents — they are section_note. If everything becomes an incident, the register turns into noise and stops defending the venue.

Keep descriptions verbatim. Do not tidy the manager's grammar.`;

const client = new Anthropic();

export async function analyse({ text, floorplan = [], now = "" }) {
  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 4096,
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    // Extraction, not deep reasoning — low effort keeps the chat responsive.
    output_config: { effort: "low", format: zodOutputFormat(Analysis) },
    messages: [
      {
        role: "user",
        content: `Venue floorplan (the only valid locations): ${floorplan.join(", ")}
Current time on shift: ${now || "unknown"}

The manager said:
"""
${text}
"""`,
      },
    ],
  });

  if (!response.parsed_output) throw new Error("Model returned unparseable output");
  return response.parsed_output;
}

/* Works as a Vercel serverless function and behind the Vite dev
   middleware in vite.config.js. */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: "POST only" }));
  }
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const result = await analyse(body ?? {});
    res.setHeader("content-type", "application/json");
    return res.end(JSON.stringify(result));
  } catch (err) {
    /* The client falls back to the local detector on any failure,
       so a dead key or a rate limit degrades the demo rather than
       breaking it. */
    res.statusCode = err?.status === 429 ? 429 : 500;
    res.setHeader("content-type", "application/json");
    return res.end(JSON.stringify({ error: err?.message ?? "analysis failed" }));
  }
}
