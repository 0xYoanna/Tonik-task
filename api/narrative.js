/* ─────────────────────────────────────────────────────────────
   THE WRITTEN ACCOUNT
   Turns the structured record into the prose a licensing officer,
   an insurer or a solicitor will actually read two years from now.

   The structured fields are the register entry. This is the
   narrative that has to stand up beside them — and the two must
   never disagree, which is why it is generated FROM the record
   rather than from the conversation.
   ───────────────────────────────────────────────────────────── */

import Anthropic from "@anthropic-ai/sdk";

const SYSTEM = `You write the narrative section of a statutory incident report for a licensed venue, from a structured record a duty manager has already confirmed.

This document may be read years later by a licensing officer, an insurer, a solicitor, or a court. Write accordingly.

Rules, in order of importance:

1. Invent nothing. Every fact must come from the record you are given. If something is missing — a time, a name, whether police attended — say so explicitly ("no time was recorded", "the individuals were not identified"). A stated gap is defensible; a plausible guess is not.
2. Do not embellish, dramatise, or characterise anyone. "Two men were separated by door staff" — not "an aggressive altercation". You are recording, not narrating.
3. Attribute. Make clear what the manager witnessed themselves, what was reported to them, and what the system recorded automatically.
4. Use the venue's own vocabulary for places and the manager's own words where they are quoted.
5. Note evidence: what was preserved, which camera and window, what was attached, and what was not available.
6. Past tense, third person, plain English. No headings inside a section. No bullet points.

Structure, as plain prose paragraphs:
- One paragraph per incident: when, where, what happened, who was involved, who dealt with it, what was done, what the outcome was.
- A short closing paragraph covering evidence preserved and anything outstanding.

Aim for a thorough account — several sentences per incident. Length should come from detail actually present in the record, never from padding.`;

const client = new Anthropic();

export async function narrate({ venue, incidents = [], sections = {}, notes = "" }) {
  const record = JSON.stringify({ venue, incidents, sections, notes }, null, 1);
  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 4096,
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    messages: [
      {
        role: "user",
        content: `Write the narrative account from this record. Return prose only — no preamble, no headings, no markdown.${
          notes
            ? `\n\nThe manager read a previous draft and asked for this: "${notes}". Honour it, but never at the cost of accuracy to the record.`
            : ""
        }\n\n${record}`,
      },
    ],
  });
  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  if (!text) throw new Error("empty narrative");
  return { narrative: text };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: "POST only" }));
  }
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const result = await narrate(body ?? {});
    res.setHeader("content-type", "application/json");
    return res.end(JSON.stringify(result));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    return res.end(JSON.stringify({ error: err?.message ?? "narrative failed" }));
  }
}
