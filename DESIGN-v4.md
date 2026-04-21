# DESIGN-v4.md — WGD Insight Style System

> Extracted from wgdinsight.com — a B2B/fintech SaaS landing page with an
> editorial, premium-neutral aesthetic. Warm stone-white backgrounds, serif
> display type, glass-morphism cards, a signature dual-card layout (dark slate +
> frosted white), and teal as the single data accent. Designed to communicate
> trustworthy intelligence without the coldness of typical fintech.

---

## 1. Visual Theme & Atmosphere

WGD Insight's design language is **editorial intelligence** — the visual tone of a
well-produced financial newsletter turned into a web product. It borrows from
long-form journalism (serif display type, wide tracking uppercase section labels,
generous whitespace) and fuses it with modern SaaS conventions (glass-morphism
cards, frosted nav, soft grid background).

**Structural signature:** A persistent **dual-card layout** — one dark `slate-950`
card (primary feature, dark mode feel) and one frosted white card (secondary context,
light mode feel) — sitting side by side. This creates natural light/dark contrast
without a full page theme switch.

**Color philosophy:** Near-neutral with purpose. The base is warm stone
(`stone-100 → white → slate-100` gradient) rather than pure white, giving it a
paper-like quality. The single data accent is **teal** (`teal-300/90`) used
exclusively inside dark cards for icons and step numbers — never decoratively
on light surfaces. A subdued **amber** (`amber-200`, `amber-50`) appears only in
the Pricing nav badge.

**Background texture:** A subtle **32×32px dot/line grid** overlay at `opacity-[0.4]`
using `rgba(15,23,42,0.05)` lines — barely visible, architectural. Three decorative
blurred orbs (teal, amber, slate) in the hero section add depth without distraction.

**Tone:** Confident, precise, professional — but warmer than Bloomberg. This is
for smart individual investors who value clarity over aesthetics, but appreciate
when a product doesn't look like a 2012 Bootstrap site.

**Not this:**
- ❌ Bright colors, neon, playful gradients
- ❌ Heavy decoration or illustration
- ❌ Rounded pill buttons on dark surfaces
- ❌ Mobile-app consumer softness (like v3/Favly)

---

## 2. Color Palette & Roles

### Base Surfaces

| Name | Value | Role |
|---|---|---|
| Page gradient start | `stone-100` (`#f5f5f4`) | Top-left page background |
| Page gradient mid | `white` (`#ffffff`) | Center |
| Page gradient end | `slate-100` (`#f1f5f9`) | Bottom-right |
| Card (light) | `white/82` → `white/88` | Frosted glass cards |
| Card (dark) | `slate-950` (`#020617`) | Dark feature cards |
| Sunken | `stone-50` (`#fafaf9`) | Feature pill backgrounds, inner cells |
| Footer card | `white/82` | Footer container |

### Text Scale

| Token | Value | Role |
|---|---|---|
| Primary | `slate-950` (`#020617`) | Headings, key numbers |
| Secondary | `slate-700` (`#334155`) | Body copy |
| Tertiary | `slate-600` (`#475569`) | Supporting text, descriptions |
| Muted | `slate-500` (`#64748b`) | Labels, step numbers, captions |
| Inverted primary | `white` (`#ffffff`) | Text on dark cards |
| Inverted secondary | `slate-300` (`#cbd5e1`) | Subtext on dark cards |
| Inverted muted | `slate-400` (`#94a3b8`) | Labels on dark cards |

### Accent Colors

| Name | Value | Use |
|---|---|---|
| Teal accent | `teal-300/90` (`rgba(94,234,212,0.9)`) | Icons and step numbers on dark cards ONLY |
| Slate CTA | `slate-950` | Primary button background |
| Slate CTA hover | `slate-800` (`#1e293b`) | Primary button hover |
| Amber pricing | `amber-200` border / `amber-50/90` bg / `amber-700` text | Pricing nav badge (one-off use) |

### Borders

| Context | Value |
|---|---|
| Light card border | `slate-200/80` → `slate-200/90` |
| Dark card border | `slate-800` (`#1e293b`) |
| Nav border | `slate-200/80` |
| Divider within card | `slate-200` |
| Icon container (light) | `slate-200` bg `stone-50` |
| Icon container (dark) | `white/10` bg `white/5` |

---

## 3. Typography Rules

### Font Families

| Role | Font | Source |
|---|---|---|
| Display / Headings | `font-serif` (system serif) | CSS `font-serif` stack: Georgia, Times New Roman |
| Body / UI | System sans-serif | `-apple-system, BlinkMacSystemFont, system-ui` |
| Labels / Badges | System sans-serif, uppercase | Same stack |

> WGD Insight uses **no custom web fonts loaded via @import** — relies entirely
> on system serif for display and system sans for UI. This is unusual and
> intentional: it gives a newspaper-like authenticity and loads instantly.
> If adding web fonts: **Playfair Display** or **Lora** would match the serif spirit.
> For sans: **Inter** or **DM Sans** (used in v3) would fit.

### Type Hierarchy

| Role | Element | Size | Weight | Case | Tracking | Line Height |
|---|---|---|---|---|---|---|
| Hero display | `h1 font-serif` | `clamp(3.3rem,7vw,6rem)` | 400 (serif) | Mixed | `-0.04em` | `0.95` |
| Section title | `h2 font-serif` | `3xl–5xl` (30–48px) | 400 | Mixed | tight | `1.1–1.2` |
| Card heading | `h3 font-serif` | `2xl–3xl` (24–30px) | 400 | Mixed | tight | `1.1` |
| Card heading (small) | `h3 font-semibold` | `lg–xl` (18–20px) | 600 | Mixed | `0` | `1.3` |
| Section label | `p uppercase` | `xs` (12px) | 600 | UPPERCASE | `0.22em` | `1.4` |
| Body | `p` | `sm–base` (14–16px) | 400 | Mixed | `0` | `1.75` (leading-7) |
| Step number | `p uppercase` | `xs` (12px) | 600 | UPPERCASE | `0.18em` | — |
| Stat value | — | `2xl` (24px) | 600 | — | `0` | — |
| Stat label | — | `xs` (12px) | — | UPPERCASE | `0.16em` | — |

### Key Typographic Signatures
- **Serif for impact, sans for clarity** — never mix in the same text block
- Hero heading uses `leading-[0.95]` — ultra-tight, monumental
- Section labels are the most tracked text: `tracking-[0.22em]` — like newspaper
  bylines
- Body copy uses `leading-7` (28px line height at 16px) — generous, readable
- Step numbers use `tracking-[0.18em]` uppercase — industrial wayfinding meets editorial

---

## 4. Component Stylings

### Primary Button (Slate CTA)

```css
background: #020617  /* slate-950 */
color: white
border: none
border-radius: 9999px  /* rounded-full */
height: 40px (nav) / 48px (hero)
padding: 8px 20px (nav) / 8px 24px (hero)
font: system-sans 14px weight 600
transition: background 200ms

hover: background #1e293b  /* slate-800 */
icon: ArrowRight, 16px, weight 2 stroke
```

### Secondary Button (Ghost)

```css
background: white
color: slate-700
border: 1px solid slate-300
border-radius: 9999px
height: 40px / 48px
padding: 8px 20px / 8px 24px
font: system-sans 14px weight 600

hover:
  background: slate-100
  color: slate-950
```

### Navigation

```css
position: fixed, top: 0, full-width
background: white/82  /* semi-transparent */
backdrop-filter: blur(12px)  /* md */
border-bottom: 1px solid slate-200/80
height: 4.5rem (72px)

logo: img, height 40px
nav links: text-sm font-medium text-slate-700
CTA buttons: rounded-full, height 40px
container: max-w-6xl, centered, px-4/6/8
```

### Dark Feature Card

```css
background: slate-950  /* #020617 */
border: 1px solid slate-800
border-radius: 1.5rem  /* rounded-3xl = 24px */
padding: 24–28px (6–7 in Tailwind)
box-shadow: 0 24px 60px -32px rgba(15,23,42,0.55)

text-primary: white
text-secondary: slate-300
labels: slate-400, uppercase, tracking-[0.18-0.22em]
accent (icons/steps): teal-300/90
icon container: border white/10, bg white/5, rounded-full, p-2
step divider: border-t white/10
```

### Light Glass Card

```css
background: white/82–white/88
backdrop-filter: blur(4px)  /* backdrop-blur-sm */
border: 1px solid slate-200/80–slate-200/90
border-radius: 1.5rem  /* rounded-3xl = 24px */
padding: 24–32px
box-shadow: 0 18–24px 40–60px -32–36px rgba(15,23,42,0.28–0.35)

text-primary: slate-950
text-secondary: slate-600
labels: slate-500, uppercase, tracking-[0.20–0.22em]
icon container: border slate-200, bg stone-50, rounded-full, p-2, text-slate-600/700
divider: border-t slate-200
```

### Feature Pills / Tags

```css
background: stone-50
border: 1px solid slate-200
border-radius: 9999px  /* rounded-full */
padding: 6px 12px
font: text-sm text-slate-600
```

**Section label badge (e.g., "Open Access Now Available"):**
```css
border: 1px solid slate-300
background: slate-50
border-radius: 9999px
padding: 4px 12px
font: text-xs font-semibold uppercase tracking-[0.18em] text-slate-600
```

### Step Number Badge (in card footer)

```css
/* Dark card: */
color: teal-300/90
font: text-xs font-semibold uppercase tracking-[0.18em]

/* Light card (sidebar step): */
background: slate-100
border-radius: 9999px
padding: 4px 12px
display: inline-flex items-center gap-1
font: text-xs font-semibold uppercase tracking-[0.14em] text-slate-500
includes: ArrowRight icon 14px
```

### Stats Row (3-column)

```css
/* Container */
display: grid, 3 columns, gap-4
border-top: 1px solid slate-200, pt-6, mt-8

/* Each stat */
value: text-2xl font-semibold text-slate-950
label: text-xs uppercase tracking-[0.16em] text-slate-500

/* Dividers between stats (tablet+): */
sm:border-l sm:border-slate-200 sm:pl-4
```

### Icon Container Pattern

```css
/* Light surface: */
border: 1px solid slate-200
background: stone-50  /* #fafaf9 */
border-radius: 9999px
padding: 8px
color: slate-600–slate-700

/* Dark surface: */
border: 1px solid rgba(255,255,255,0.10)
background: rgba(255,255,255,0.05)
border-radius: 9999px
padding: 8px
color: teal-300/90
```

---

## 5. Layout Principles

### Grid System

**Hero layout:** 2-column asymmetric (`1.08fr : 0.92fr`), gap 48px on desktop
**Feature layout:** 2-column (`0.88fr : 1.12fr`), with nested 2-col inside right (`1.08fr : 0.92fr`)
**How It Works layout:** 2-column (`0.85fr : 1.15fr`)
**Footer:** 2-column (`1.2fr : 0.8fr`) with nested 2-col on right

Max content width: `max-w-6xl` (1152px), centered `mx-auto`
Horizontal padding: `px-4 sm:px-6 lg:px-8`

### Spacing Rhythm

| Section | Vertical padding |
|---|---|
| Hero | `pt-28 sm:pt-32 pb-12 lg:pb-16` |
| Feature sections | `pb-16 lg:pb-20` |
| Footer | `pt-4 pb-10 lg:pb-14` |
| Card internal | `p-6 sm:p-7 lg:p-10` |
| Between cards in grid | `gap-5 lg:gap-6` |
| Section top labels | `mb-4` below label, `space-y-4` before heading |

### Border Radius Scale

| Size | Tailwind | Value | Use |
|---|---|---|---|
| Default card | `rounded-3xl` | 24px | ALL cards, footer, panels |
| Feature pills | `rounded-2xl` | 16px | Small info chips |
| Buttons | `rounded-full` | 9999px | All buttons |
| Icon containers | `rounded-full` | 9999px | Icon wrappers |
| Step number badges | `rounded-full` | 9999px | Numbered steps |
| Toast | `rounded` (8px) | 8px | Notification toasts |

> **Key:** Cards use `rounded-3xl` (24px), never smaller. Buttons use `rounded-full`.
> This is the inverse of v2 (zero radius) — every container here is rounded.

### Whitespace Philosophy

- **Expansive sections** — generous vertical padding, content never feels rushed
- **Cards have breathing room** — `p-6` minimum, `p-10` on large feature cards
- **Left-aligned body text** within containers, centered section headers at section level
- `space-y` utilities inside cards create consistent vertical rhythm: `space-y-3` (compact), `space-y-4` (standard), `space-y-6` (section)

---

## 6. Depth & Elevation

### Shadow System

| Level | Value | Use |
|---|---|---|
| Light card | `0 18-24px 40-60px -32-36px rgba(15,23,42,0.25-0.35)` | Frosted white cards |
| Dark card | `0 24px 60px -32px rgba(15,23,42,0.55)` | `slate-950` feature cards |
| Footer card | `0 24px 60px -36px rgba(15,23,42,0.25)` | Footer container |
| Nav | `shadow-sm` | Navigation bar |

> All shadows use **negative spread** (`-32px` to `-36px`) — this concentrates
> the shadow directly below the card rather than diffusing it outward, creating
> a grounded "floats off the page" effect.

### Background Depth Layers

1. **Gradient base:** `from-stone-100 via-white to-slate-100` diagonal gradient
2. **Grid overlay:** `32px` line grid at `opacity-[0.4]`, `rgba(15,23,42,0.04-0.05)` — barely visible
3. **Decorative orbs:**
   - Top-left: `teal-200/40`, `blur-3xl`, 56×56 (`14rem`) — soft teal
   - Top-right: `amber-200/50`, `blur-3xl`, 72×72 (`18rem`) — warm amber
   - Bottom-center: `slate-300/30`, `blur-3xl`, 64×64 (`16rem`) — cool neutral
4. **Card surfaces:** frosted glass (`white/82–88`) and dark slate (`slate-950`)

---

## 7. Do's and Don'ts

### ✅ Do
- Use **`rounded-3xl`** (24px) on all cards and containers — it's the brand shape
- Use **`rounded-full`** on all buttons, pills, icon containers, badges
- Use **serif font for all headings** — it creates the editorial/intelligence signal
- Keep the **dual-card pattern**: one dark `slate-950` + one frosted white per section
- Use **teal ONLY inside dark cards** — never on light surfaces as decoration
- Apply **negative-spread shadows** (`-32px to -36px`) for grounded depth
- Use the **grid dot texture** as background decoration (low opacity, barely visible)
- Section labels: always `text-xs uppercase tracking-[0.20–0.22em] text-slate-500`
- Stats: always `text-2xl font-semibold` value + `text-xs uppercase tracking-[0.16em]` label

### ❌ Don't
- Don't use sharp corners on cards or buttons — minimum `rounded-2xl` for any container
- Don't use teal on light/white backgrounds — it's a dark card accent only
- Don't use colored CTA buttons — the primary action is always `slate-950` (near-black)
- Don't use gradient fills on text or cards — the gradient lives only in the page background
- Don't center-align body text within cards
- Don't use heavy border colors — borders are always `slate-200/80–90` (transparent)
- Don't skip the section label pattern — `UPPERCASE · 0.22em tracking` is the section wayfinding system
- Don't use `font-serif` for body copy — only headings/display

---

## 8. Responsive Behavior

### Breakpoints

| Name | Breakpoint | Key Changes |
|---|---|---|
| Mobile | `< 768px` | Nav hamburger, single-column cards, reduced hero font |
| Tablet | `md: 768px` | Nav links visible, 2-col begins where flagged |
| Desktop | `lg: 1024px` | Full asymmetric grid layouts activate |
| Wide | — | `max-w-6xl` constrains at 1152px |

### Mobile Specifics
- Hero: single column, `pt-28` to clear fixed nav
- Cards: full-width, `rounded-3xl` maintained
- Nav: hamburger with icon button (`h-10 w-10 rounded-full`)
- Grid lines background: maintained at same opacity
- Decorative orbs: reduced to `w-[300px]`/`h-[300px]` from `w-[600px]`

---

## 9. Special Patterns

### Background Grid Texture

```css
background-image:
  linear-gradient(to right, rgba(15,23,42,0.05) 1px, transparent 1px),
  linear-gradient(to bottom, rgba(15,23,42,0.04) 1px, transparent 1px);
background-size: 32px 32px;
opacity: 0.4;
position: absolute;
inset: 0;
```
Used on: hero section wrapper, always behind all content.

### Dual Card Hero Pattern

Right column of hero is split into two stacked cards:
1. **Dark card** (top, larger): dark feature explanation with teal accents
2. **Light card** (bottom, smaller): secondary info, frosted glass

This pattern should be reused wherever a primary feature needs high visual contrast
with a secondary supporting element.

### Step Numbering Pattern

Steps are displayed consistently with:
- Label: `text-xs font-semibold uppercase tracking-[0.18em]`
- Number: `"01"` / `"02"` / `"03"` — zero-padded, two digits
- On dark cards: teal color
- On light cards: inline badge `rounded-full bg-slate-100 px-3 py-1` with ArrowRight icon

### Animation Pattern

Cards animate in on scroll:
```css
/* Initial state (injected via JS) */
opacity: 0;
transform: translateY(18-24px);

/* After intersection: transition to */
opacity: 1;
transform: translateY(0);
transition: opacity 0.5s, transform 0.5s;
```

---

## 10. Agent Prompt Guide

### Quick Color Reference

```
Page background:     gradient from-stone-100 via-white to-slate-100
Light card:          white/82–88, border slate-200/80–90, rounded-3xl
Dark card:           slate-950, border slate-800, rounded-3xl
Primary text:        slate-950 (#020617)
Secondary text:      slate-600 (#475569)
Muted text:          slate-500 (#64748b)
Dark card text:      white / slate-300 / slate-400
Accent (dark only):  teal-300/90
Primary CTA:         slate-950 bg, white text, rounded-full
Border radius:       cards 24px (rounded-3xl), buttons full pill
Shadow:              0 24px 60px -32px rgba(15,23,42,0.55) [dark]
                     0 24px 60px -36px rgba(15,23,42,0.35) [light]
Font display:        font-serif (Georgia fallback)
Font body:           system-ui / -apple-system
```

### Example Prompts

**Hero section:**
> "Two-column asymmetric grid (`1.08fr : 0.92fr`). Left: `rounded-3xl white/88` card with border `slate-200/80`, shadow. `h1 font-serif tracking-[-0.04em] leading-[0.95]` in `slate-950`. CTA: `rounded-full slate-950` button + ghost button. 3-col stat row at bottom with `text-2xl font-semibold` values and `text-xs uppercase tracking-[0.16em]` labels. Right: stacked dark+light cards."

**Dark feature card:**
> "`slate-950` bg, `rounded-3xl`, border `slate-800`, shadow `0 24px 60px -32px rgba(15,23,42,0.55)`. Section label `text-xs font-semibold uppercase tracking-[0.22em] text-slate-400`. Heading `font-serif text-2xl text-white`. Steps separated by `border-t border-white/10`. Icon containers `rounded-full border border-white/10 bg-white/5 p-2 text-teal-300/90`."

**Frosted glass card:**
> "`white/82` bg, `backdrop-blur-sm`, `rounded-3xl`, border `slate-200/90`, shadow `0 20px 40px -34px rgba(15,23,42,0.35)`. Section label `text-xs font-semibold uppercase tracking-[0.20em] text-slate-500`. Icon containers `rounded-full border border-slate-200 bg-stone-50 p-2 text-slate-700`."

**Section label pattern:**
> `<p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Section Name</p>`

### Style Keywords

- "More editorial" → increase serif usage, widen section label tracking, add more grid texture
- "More premium" → darken cards (`slate-900→950`), deepen shadows, add teal orbs
- "Less fussy" → reduce card count per section, increase whitespace between elements  
- "More data-dense" → add stats rows, use `text-xs leading-7` label+value pairs
- "Lighter" → increase `white/` opacity on cards, use `shadow-sm` only, reduce orb sizes
