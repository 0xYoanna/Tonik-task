# Tailwind + shadcn

Tailwind **v4** (latest 4.3.x) with **shadcn/ui**. Most Tailwind knowledge in
training data is v3 and is now wrong — that's what most of this file is for.

## shadcn components ship as-is

Do not add variants, do not edit a `cva` config, do not restyle anything in
`src/components/ui/`. The only permitted local change there is the `cn` import
path, and `npm run ui:add` handles that automatically.

`src/index.css` is shadcn's stock **neutral** theme, generated verbatim from
`ui.shadcn.com/r/colors/neutral.json`. There are no custom colour tokens.

Use stock classes and stock variants only:

| Need | Use |
|---|---|
| body text / secondary text | `text-foreground` / `text-muted-foreground` |
| a panel | `bg-card` + `border-border` |
| page ground / quiet fill | `bg-background` / `bg-muted` |
| emphasis | `text-primary`, `bg-primary` |
| something bad | `text-destructive` |
| badge variants | `default` `secondary` `destructive` `outline` |
| button variants | `default` `secondary` `outline` `ghost` `destructive` `link` |

There is no `warning` or `success` in stock shadcn. **Don't invent one** — use
`outline`/`secondary`, or shadcn's `Alert`.

`className` on a shadcn component is for one-off **layout** (`flex-1`,
`max-w-sm`), never colour. Reaching for colour means the wrong component.

## v3 syntax is dead

We still hand-write ~140 class strings outside `ui/`, so this matters.

| Never write (v3) | Write instead (v4) |
|---|---|
| `tailwind.config.js` | CSS-first — `@theme` in `src/index.css` |
| `@tailwind base/components/utilities` | `@import "tailwindcss";` |
| `bg-opacity-50`, `text-opacity-80` | `bg-black/50`, `text-white/80` |
| `bg-gradient-to-r` | `bg-linear-to-r` (also `bg-conic`, `bg-radial`) |
| `!bg-red-500` | `bg-red-500!` — `!` goes at the **end** |
| `bg-[--brand]` | `bg-(--brand)` — parentheses for CSS vars |
| `grid-cols-[max-content,auto]` | `grid-cols-[max-content_auto]` — underscore |
| `flex-shrink-0`, `flex-grow` | `shrink-0`, `grow` |
| `overflow-ellipsis` | `text-ellipsis` |
| `@layer utilities { }` | `@utility name { }` |
| `outline-none` | `outline-hidden` |

**Renamed scales** — the old bare name shifted down one step:
`shadow`→`shadow-sm`, `shadow-sm`→`shadow-xs`; same for `drop-shadow-*`,
`blur-*`, `backdrop-blur-*`, `rounded-*`. `ring`→`ring-3`.

## v4 defaults that still bite

Most v4 gotchas are already absorbed by shadcn's base layer — `*` gets
`border-border`, and we restore `cursor: pointer` on buttons there too. Two
remain:

- **`hover:` does nothing on touch devices.** It's wrapped in
  `@media (hover: hover)`. Never put an essential affordance behind hover alone.
- **`ring` is 1px `currentColor`**, not 3px blue, if you use it outside a
  shadcn component.

## Write the fewest classes that do the job

- Collapse: `py-4` not `pt-4 pb-4`; `size-10` not `h-10 w-10`.
- Drop defaults: `flex` already implies `flex-row`.
- Use the modifier: `border-black/50`, not `border-black border-opacity-50`.
- Prefer `gap-*` on the container over margins on children — one number
  controls the rhythm instead of N.
- `prettier-plugin-tailwindcss` sorts classes. Don't sort by hand.

## Reach for native v4 before writing CSS

Container queries (`@container`, `@md:`), `not-*`, `has-*`, `group-*`/`peer-*`,
`text-shadow-*`, `mask-*`, `field-sizing-content`, `scrollbar-thin`, logical
properties (`ps-*`, `pbs-*`), `starting:`, and `animate-*` keyframes in
`@theme`. Also `tabular-nums` — don't hand-roll a numeric utility.

## Duplication: components, not `@apply`

`@apply` hides the utility layer. Allowed only for styling HTML we don't
control. Solve repetition in this order: **a loop** → **a component in
`src/components/`** → plain CSS referencing theme vars.

## Conditional classes

Never emit two classes fighting over the same property:

```jsx
<div className={`flex ${isGrid && "grid"}`} />   // wrong — CSS order decides
<div className={isGrid ? "grid" : "flex"} />     // right
```

Map variants through a lookup object so every appearance is visible at once:

```jsx
const TONE = { serious: "destructive", significant: "secondary", minor: "outline" };
<Badge variant={TONE[severity]} />
```

## Keep the classes readable in place

`READING-THE-CODE.md` promises a designer they can open a component, find a
value, and change it. Honour that:

- Classes stay visible in the JSX. No indirection that means hunting through
  three files to find where `p-4` was decided.
- If a class string needs wrapping, the element is usually doing too much —
  split the component.
- Arbitrary values (`p-[13px]`, `bg-[#f43]`) mean the design system has a gap.
  Use the stock scale. Genuine one-offs should be rare enough to notice.
- Inline `style` only for values that come from data at runtime.
