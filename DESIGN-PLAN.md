# Design Plan — Marciano's Pizza Truck
*Written before any code, per brief Section 0. This file also carries the handoff notes (Section 5 unknowns) at the bottom.*

## Stack

Vanilla HTML/CSS/JS. One page (`index.html`), one stylesheet, one script, one
`availability.json`. No build step, no framework, no date-picker library. The
owners can edit availability by hand in a text editor.

## Palette (from brief §4.1, with usage rules)

| Token | Hex | Usage rules |
|---|---|---|
| `--ember` | `#C43F1E` | Primary action only: the one CTA button, form submit, booked-date cells, price placeholders, input focus underline. Never body text on char (3.5:1 — fails). |
| `--char` | `#171310` | Replaces both black and grey everywhere. Body text on light sections; background of hero, calendar, form. Shadow tint if any (there are none). |
| `--brick` | `#8C4A2F` | Rules between package rows, input underlines, photo-slot dashed borders, small labels on semolina (4.9:1 ✓). Never text on char (2.7:1). |
| `--semolina` | `#E8DCC0` | Light section backgrounds; all text on char/brick/bay backgrounds (13.4:1 on char ✓). |
| `--bay` | `#4A5B3C` | Exactly two uses: calendar open-date cells, footer background. Semolina text on bay = 5.4:1 ✓. |

Ember and bay never touch: in the calendar both cell types sit on the char
field with a 8px grid gap, so char is always the neutral between them.

Contrast, computed (WCAG relative luminance):
semolina/char 13.4:1 · char/semolina 13.4:1 · semolina/bay 5.4:1 ·
semolina/ember 3.8:1 (used only on buttons at 1.25rem/700 = large text, ≥3:1 ✓) ·
semolina/ember-deep (#B23918, booked calendar cells) 4.7:1 ✓ ·
brick/semolina 4.9:1 (small labels only).

## Type

- **Zodiak** (Fontshare) 400/700 — H1, H2, calendar date numerals, price numerals.
- **Satoshi** (Fontshare) 400/500/700 — everything else.
- Fallbacks sized to match: `Zodiak, Georgia, 'Times New Roman', serif` and
  `Satoshi, 'Helvetica Neue', Arial, sans-serif`. `font-display: swap` via
  Fontshare CSS API.

Scale exactly as briefed:

```
H1     clamp(3.5rem, 9vw, 7.5rem)     lh 0.92   ls -0.03em   Zodiak 700
H2     clamp(2.25rem, 4.5vw, 3.5rem)  lh 1.0    ls -0.02em   Zodiak 700
H3     1.5rem                          lh 1.15              Satoshi 700
body   1.125rem                        lh 1.6               Satoshi 400
small  0.875rem                        lh 1.45   ls 0.01em   Satoshi 500
```

H1 left-aligned on a 7/5 grid, never centered.

## Spacing

Scale: `4, 8, 12, 20, 32, 56, 88, 144` (px, as CSS custom properties).
Section vertical padding, top to bottom: hero **144** → calendar **56** →
event sequence **144** → packages **88** → gallery **144** → FAQ **56** →
form **144**. The calendar's 56 is intentional — it reads tighter and more
urgent than its neighbours. Do not normalize.

## Wireframe

```
+----------------------------------------------------------+
| MARCIANO'S PIZZA TRUCK          Dates Events Packages FAQ |
|                                        (631) 960-1271 tel |
+---------------------------------+------------------------+
| char bg, firelight loop         |                        |
|  HUNTINGTON, NY  (small, brick) |  [TRUCK PHOTO SLOT]    |
|  H1: Wood-fired catering        |  dashed, bleeds off    |
|  from a 1941 truck.             |  the right viewport    |
|  one factual sub-line           |  edge — THE ONE        |
|  [ Check your date ]  (ember)   |  GRID BREAK            |
+---------------------------------+---------------+--------+
| CALENDAR — char bg, pad 56                                |
| "Saturdays, Aug–Oct 2026"                                 |
| [AUG]        [SEP]        [OCT]     (1-up on mobile)      |
|  01 08 15…    05 12 19…    03 10…   Zodiak numerals,      |
|  bay=open (click→form), ember=booked (aria-disabled)      |
+-----------------------------------------------------------+
| semolina bg, pad 144 — HOW AN EVENT RUNS (5/7 split)      |
|  narrow text col | wide photo slot (pasta pan)            |
|  01 arrival · 02 oven service · 03 the pan · 04 dessert   |
|  (numbered: a genuine time sequence — order = information)|
+-----------------------------------------------------------+
| semolina bg + flour plate at 6%, pad 88 — PACKAGES        |
|  price list, NOT cards. Three rows, 1px brick rules       |
|  between. Tier name left, $X,XXX Zodiak huge in ember     |
|  right, one inclusion line under each.                    |
+-----------------------------------------------------------+
| char bg, pad 144 — GALLERY: masonry via CSS columns,      |
|  7 slots, 4 aspect ratios, deliberately irregular          |
+-----------------------------------------------------------+
| semolina bg, pad 56 — FAQ: <details> rows, brick rules,   |
|  the 6 unknowns live here as flagged placeholders          |
+-----------------------------------------------------------+
| char bg, pad 144 — INQUIRY FORM, 5 fields:                |
|  name / email / phone / event date (prefilled by          |
|  calendar) / tell-us-about-it. Underline inputs.          |
|  FORM_ENDPOINT constant, clearly marked.                  |
+-----------------------------------------------------------+
| bay bg — footer: address, tel, mailto, Instagram. Small.  |
+-----------------------------------------------------------+
```

Fire-divider plates (Higgsfield, §4.8) sit between calendar→event and
gallery→FAQ as full-width ~220px bands with a 40% char overlay.

## Signature element

The availability calendar: three months of Saturdays only, rendered as a real
CSS grid from `availability.json`. Open dates are `<button>`s in bay that
scroll to the form and prefill the date field; booked dates are ember,
`aria-disabled`, not focusable as actions. Keyboard: arrow keys move between
dates, Enter/Space selects. Announced via `aria-live` when a date is picked.

## Motion

One idea: a 12s CSS-only firelight loop on the hero — two layered warm radial
gradients whose position/opacity drift at low amplitude. Nothing else animates
except hover/focus states. Full `prefers-reduced-motion` kill block ships.

## The honest paragraph (self-critique before code)

If I were handed a generic "food truck catering" brief, would I have produced
roughly this? The layout skeleton, no — the brief pins it. But my first
instinct for the calendar was a neat little date-picker widget: rounded cells,
small numerals, quiet — a SaaS booking component dropped into a brand site,
which is exactly what any templated build would do, and it would bury the one
thing no competitor has. So I changed it: the calendar is set typographically,
not widget-ly — date numerals in Zodiak at display size (the same voice as the
H1 and the prices), month names as large sidebar labels, status carried by the
color field of the whole cell rather than a legend dot. It should read like a
chalked specials board in a restoration shop, not a form control. Second
change for the same reason: my instinct was to give the packages equal visual
weight in three columns — that's the template again, and the brief bans cards —
so they are three unequal rows of a price list where the numeral is the
typographic event and the tier name is subordinate. The typography IS the
brand; the widgets don't get their own aesthetic.

---

# HANDOFF NOTES — Section 5 unknowns (all seven, flagged)

1. **Package pricing** — BLOCKER #1. All three tiers show `$X,XXX` in ember.
   The packages section is meaningless until real figures arrive.
2. **Guest count minimums/maximums** — unknown. FAQ placeholder row.
3. **Travel radius & travel fees** — unknown. FAQ placeholder row.
4. **Space / power / propane requirements** — unknown. **HIGH PRIORITY**: this
   is one of the three questions blocking every prospect ("will it fit in my
   driveway"). FAQ placeholder row, listed first.
5. **Deposit & cancellation terms** — unknown. FAQ placeholder row.
6. **Rain policy** — unknown. FAQ placeholder row.
7. **Booked dates** — `availability.json` is seeded with an obviously fake
   alternating pattern; `_comment` keys in the file explain the format and how
   to edit it. Swap point for a Google Calendar public feed is marked in
   `js/main.js` (`loadAvailability()`).

## Copy status

Brief §0: copy is drafted elsewhere and was not supplied in this session, so
every voicey string on the page is **short neutral factual text derived from
brief §3.1 facts** (truck year, oven origin, service area, menu facts) — not
generated marketing prose. Strings needing the client's real copy are marked
`<!-- COPY: awaiting client -->` in the markup: hero H1 + subline, the four
event-sequence descriptions, tier names/inclusions, FAQ answers. Testimonial
slots are labelled for real permissioned quotes; no review text is reproduced.

## Other scope notes

- `FORM_ENDPOINT` constant at the top of `js/main.js`, clearly marked; form
  degrades to a `mailto:` fallback message if unset. No service signed up for.
- No analytics, no chat, no cookie banner, no domain referenced.
- Higgsfield plates: generated per §4.8 (firebrick light ×3, flour dust ×1),
  compressed to keep first load under 1.5MB. No pizza/pasta/people/truck
  imagery generated anywhere. `remove_background` step for the real truck
  photo is deferred until the client supplies it (swap point: hero photo slot).
