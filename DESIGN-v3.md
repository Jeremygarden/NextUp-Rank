# DESIGN-v3.md — Favly Style System

> Extracted from favly.me — a social taste-profile product with a polished,
> consumer-friendly design language. Warm off-white + dark dual-theme, generous
> rounded corners, glass-morphism surfaces, and a bold red accent. Opposite
> personality from v2 (industrial/metro): this system is approachable, tactile,
> and social.

---

## 1. Visual Theme & Atmosphere

Favly's design language is **soft consumerism with editorial polish** — the visual
equivalent of a well-designed iOS app rendered on the web. It speaks directly to a
social/entertainment audience through tactile surface layering, generous roundness,
and a signature Apple-esque warm neutral palette.

The system is **dual-mode by default**: a warm off-white light mode (`#f5f5f7` base,
very close to Apple's signature background) and a true-dark mode (`#0f0f0f` base).
Both modes share the same semantic token names, swapped via a `.dark` class on the
root. This is not an afterthought dark mode — it's a first-class design decision
with separate shadow systems, glow intensities, and glass opacities tuned per mode.

**Signature characteristics:**
- **Glass-morphism surfaces** — 5-tier `rgba(white/black, opacity)` system for layering
- **Backdrop blur** — `blur(8–20px) saturate(130–160%)` on floating panels
- **Apple influence** — system font stack, `#f5f5f7` base, iOS-style red (`#ff3b30` dark / `#e8352c` light)
- **Generous radius** — `0.75rem` default, pill-shaped CTAs (`100px`), `6px` minimum for small elements
- **Display font: Syne** — geometric, slightly wide, confident but not aggressive
- **Body font: DM Sans** — friendly grotesque, excellent readability at small sizes
- **Mono: Geist Mono** — technical without being cold
- **Rich shadows in dark mode** — soft glow halos on buttons, deep ambient card shadows
- **Grain texture** — subtle noise overlay at `opacity 0.15` (light) / `0.55` (dark) with `soft-light`/`overlay` blend mode

**Mood:** Late-night Netflix + dating app energy. Social proof is visually important
(compatibility scores, profile cards). The design invites interaction, never intimidates.

**Not this:**
- ❌ Sharp corners / zero radius
- ❌ Industrial/mechanical aesthetic
- ❌ Data-dense grids
- ❌ Muted desaturated palettes

---

## 2. Color Palette & Roles

### Light Mode (`:root`)

| Token | Value | Role |
|---|---|---|
| `--bg-base` | `#f5f5f7` | Page background — Apple warm gray |
| `--bg-elevated` | `#ffffff` | Cards, panels, modals |
| `--bg-sunken` | `#ececee` | Depressed sections, footer areas |
| `--text-primary` | `rgba(0,0,0,0.92)` | Headings, primary content |
| `--text-secondary` | `rgba(0,0,0,0.78)` | Body text |
| `--text-tertiary` | `rgba(0,0,0,0.50)` | Labels, captions, hints |
| `--text-quaternary` | `rgba(0,0,0,0.25)` | Disabled labels, placeholders |
| `--border-subtle` | `rgba(0,0,0,0.06)` | Soft separators |
| `--border-default` | `rgba(0,0,0,0.10)` | Standard borders |
| `--border-bright` | `rgba(0,0,0,0.18)` | Emphasized borders |
| `--red` | `#e8352c` | Primary CTA, destructive actions |
| `--red-hover` | `#d43028` | CTA hover state |
| `--red-active` | `#c42b23` | CTA pressed state |
| `--red-glow` | `rgba(232,53,44,0.25)` | Shadow tint on CTA |
| `--red-tint` | `rgba(232,53,44,0.08)` | Light red background fill |

### Dark Mode (`.dark`)

| Token | Value | Role |
|---|---|---|
| `--bg-base` | `#0f0f0f` | Page background |
| `--bg-elevated` | `#141414` | Cards, panels |
| `--bg-sunken` | `#080808` | Deepest background |
| `--text-primary` | `#ffffff` | Headings |
| `--text-secondary` | `rgba(255,255,255,0.92)` | Body |
| `--text-tertiary` | `rgba(255,255,255,0.70)` | Labels, hints |
| `--text-quaternary` | `rgba(255,255,255,0.28)` | Disabled |
| `--border-subtle` | `rgba(255,255,255,0.07)` | Soft dividers |
| `--border-default` | `rgba(255,255,255,0.10)` | Standard borders |
| `--border-bright` | `rgba(255,255,255,0.18)` | Emphasized |
| `--red` | `#ff3b30` | CTA — iOS red |
| `--red-hover` | `#ff453a` | CTA hover |
| `--red-glow` | `rgba(255,59,48,0.40)` | Glow halo on buttons (dark only) |

### Glass Surface Tiers (context-adaptive)

| Token | Light | Dark |
|---|---|---|
| `--glass-01` | `rgba(0,0,0,0.02)` | `rgba(255,255,255,0.04)` |
| `--glass-02` | `rgba(0,0,0,0.035)` | `rgba(255,255,255,0.055)` |
| `--glass-03` | `rgba(0,0,0,0.05)` | `rgba(255,255,255,0.08)` |
| `--glass-04` | `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.12)` |
| `--glass-05` | `rgba(0,0,0,0.12)` | `rgba(255,255,255,0.18)` |

### Semantic Accent Colors

| Color | Light | Dark | Use |
|---|---|---|---|
| Green | `#28a745` | `#30d158` | Success, compatibility match |
| Blue | `#0071e3` | `#0a84ff` | Info, links |
| Yellow | `#e6a800` | `#ffd60a` | Warning, caution |
| Purple | `#9b51e0` | `#bf5af2` | Premium tier, special features |

---

## 3. Typography Rules

### Font Families

| Role | Font | Fallback |
|---|---|---|
| Display / Headings | `Syne` | `system-ui`, `sans-serif` |
| Body / UI | `DM Sans` | `-apple-system`, `BlinkMacSystemFont`, `sans-serif` |
| Mono / Code / Stats | `Geist Mono` | `Courier New`, `monospace` |

> Google Fonts import: `Syne:wght@400;600;700;800` + `DM+Sans:wght@300;400;500;600`
> Geist Mono: via Next.js local font or CDN

### Type Hierarchy

| Role | Font | Size | Weight | Case | Letter Spacing | Line Height |
|---|---|---|---|---|---|---|
| Hero Display | Syne | 64–120px (clamp) | 700–800 | Mixed | `-0.02em` (tight) | 1.0–1.1 |
| Section Title | Syne | 32–48px | 700 | Mixed | `-0.01em` | 1.1 |
| Card Heading | Syne | 18–24px | 600–700 | Mixed | `0` | 1.2 |
| Body | DM Sans | 15–17px | 400 | Mixed | `0` | 1.6 |
| Label / Caption | DM Sans | 12–14px | 500 | Mixed | `0` | 1.4 |
| Mono Data | Geist Mono | 13–16px | 400–500 | — | `0` | 1.3 |

### Principles
- **Display text uses negative letter-spacing** at large sizes — tight, editorial
- **Syne for personality, DM Sans for readability** — separate concerns clearly
- Body text is **never uppercase** — friendly, conversational
- Geist Mono is used sparingly for scores, stats, usernames, technical labels

---

## 4. Component Stylings

### Buttons

**Primary (Red CTA)**
```css
background: var(--red)
color: #ffffff
border: none
border-radius: 100px  /* pill shape */
padding: 12px 24px
font: DM Sans 15px weight 600
box-shadow: 0 2px 8px var(--red-glow), 0 1px 3px rgba(232,53,44,0.12)

hover:
  background: var(--red-hover)
  box-shadow: 0 4px 16px var(--red-glow), 0 2px 6px rgba(232,53,44,0.15)
  transform: translateY(-1px)

/* dark mode: add glow halo */
dark box-shadow: 0 0 24px var(--red-glow), 0 4px 12px rgba(255,59,48,0.25)
```

**Secondary (Glass)**
```css
background: var(--glass-02)
border: 1px solid var(--border-default)
border-radius: var(--radius)  /* 0.75rem */
color: var(--text-primary)
padding: 10px 20px
font: DM Sans 14px weight 500

hover:
  background: var(--glass-04)
  border-color: var(--border-bright)
```

**Input Fields**
```css
background: var(--glass-02)
border: 1px solid var(--border-default)
border-radius: var(--radius)
color: var(--text-primary)
padding: 12px 16px
font: DM Sans 15px weight 400
height: 48px

focus:
  border-color: var(--red)
  outline: none
  box-shadow: 0 0 0 3px var(--red-glow-soft)

placeholder: color var(--text-tertiary)
```

### Cards

**Standard Card**
```css
background: var(--bg-elevated)
border: 1px solid var(--border-subtle)
border-radius: var(--radius)  /* 0.75rem = 12px */
box-shadow: var(--shadow-card)

/* light: 0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04) */
/* dark:  0 20px 60px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.25) */

hover:
  box-shadow: var(--shadow-card-hover)
  transform: translateY(-2px)
  transition: all 200ms ease
```

**Glass Card / Floating Panel**
```css
background: var(--glass-02)
backdrop-filter: var(--blur-md)  /* blur(12px) saturate(140%) */
border: 1px solid var(--border-subtle)
border-radius: var(--radius)
```

### Navigation

```css
background: var(--bg-elevated)  /* or glass on scroll */
border-bottom: 1px solid var(--border-subtle)
height: 56–64px

logo: Syne 20px weight 700, color var(--text-primary)
nav links: DM Sans 14px weight 500, color var(--text-secondary)
nav link hover: color var(--text-primary)
active link: color var(--red)
CTA button: pill shape, red background
```

### Badges / Tags

```css
background: var(--glass-03)
border: 1px solid var(--border-subtle)
border-radius: 100px  /* pill */
color: var(--text-secondary)
font: DM Sans 12px weight 500
padding: 4px 10px
```

**Colored variant (e.g., red tint):**
```css
background: var(--red-tint)
border-color: var(--red-border)
color: var(--red)
```

### Modal / Overlay

```css
background: var(--bg-elevated)
border: 1px solid var(--border-default)
border-radius: 20px
box-shadow: var(--shadow-modal)
  /* light: 0 24px 60px rgba(0,0,0,0.12), 0 0 0 1px border */
  /* dark:  0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px border */
```

---

## 5. Layout Principles

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `--radius-xs` | `6px` | Tiny elements, inner components |
| `--radius` | `0.75rem` (12px) | Default — cards, inputs, containers |
| `--radius-pill` | `100px` | Buttons, badges, tags |
| Modal | `20px` | Full overlays, bottom sheets |
| Avatar | `50%` | Circular profile images |

> **No sharp corners anywhere.** Roundness is the brand.

### Spacing System

Base unit: 4px
Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128

### Grid & Container

- Max content width: `1200px`, centered with `auto` margins
- Section padding: `py-12 md:py-16` → `48–64px` vertical rhythm
- Horizontal padding: `px-4` on mobile, `container mx-auto` on desktop
- Card grid: 2-column with `gap-6` (24px) on tablet, 1-column on mobile

### Whitespace Philosophy

- **Breathing room over density** — sections are generously spaced
- Hero sections use `py-24` (96px) — editorial scale
- Content sections feel "open" compared to data-dense apps
- **Center alignment** for hero text and section headers — invitation, not instruction

---

## 6. Depth & Elevation

### Light Mode Elevation

| Level | Surface | Shadow |
|---|---|---|
| Ground | `#f5f5f7` | None |
| Raised (card) | `#ffffff` | `0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)` |
| Hover | Same | `0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)` |
| Modal | `#ffffff` | `0 24px 60px rgba(0,0,0,0.12)` |

### Dark Mode Elevation

| Level | Surface | Shadow |
|---|---|---|
| Ground | `#0f0f0f` | None |
| Raised (card) | `#141414` | `0 20px 60px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.25)` |
| Hover | Same | `0 28px 80px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.35)` |
| Modal | `#141414` | `0 40px 100px rgba(0,0,0,0.60)` |
| CTA glow | `#ff3b30` button | `0 0 24px rgba(255,59,48,0.4)` |

**Key difference from light mode:** Dark mode uses dramatic depth with large blur radii and red glow halos on interactive elements. The darkness amplifies the CTA.

### Backdrop Blur Tiers

| Token | Value | Use |
|---|---|---|
| `--blur-sm` | `blur(8px) saturate(130%)` | Light overlays, headers |
| `--blur-md` | `blur(12px) saturate(140%)` | Cards, panels |
| `--blur-lg` | `blur(20px) saturate(160%)` | Full modals, heavy overlays |

---

## 7. Do's and Don'ts

### ✅ Do
- **Generous rounded corners everywhere** — pills for CTAs, 12px for cards and inputs
- Use **Syne for display/headings** — it carries the brand personality
- Apply **backdrop-filter blur** on floating/sticky elements for depth
- Use **red only for primary CTA and destructive** — one accent, used decisively
- **Dark mode glow** on interactive elements — embrace the depth
- Separate sections with `--bg-sunken` backgrounds for rhythm
- Center-align hero and section text — social/marketing convention
- Use **glass tiers** (`glass-02` for inputs, `glass-03` for secondary panels) for layering

### ❌ Don't
- Don't use sharp corners — even small elements get at least 6px radius
- Don't use pure black text — always `rgba(0,0,0,0.92)` on light, `#ffffff` on dark
- Don't use red for non-interactive decoration
- Don't skip the shadow system — shadows create the tactile quality
- Don't center body/paragraph text in dense reading contexts
- Don't use Syne for body copy — it's too display-forward at small sizes
- Don't ignore the grain texture — it adds analogue warmth to digital surfaces

---

## 8. Responsive Behavior

### Breakpoints

| Name | Width | Notes |
|---|---|---|
| Mobile | < 768px | Single column, reduced hero text size |
| Tablet | 768–1024px | 2-column cards begin |
| Desktop | 1024–1280px | Standard layout |
| Wide | > 1280px | `max-w-screen-xl` (1280px) centered |

### Hero Text Scale

```css
font-size: clamp(72px, 15vw, 120px)
```
> The display text scales fluidly — monumental on desktop, still impactful on mobile.

### Mobile Behavior
- Navigation: hamburger menu with glass overlay panel
- Cards: full-width, single column
- Modal: bottom sheet with `border-radius: 20px 20px 0 0`
- CTA button: full-width on mobile (`w-full`)

---

## 9. Special Effects

### Grain Texture
```css
/* After pseudo-element on body or section */
background-image: url("data:image/svg+xml,<noise-svg>") 
opacity: 0.15 (light) / 0.55 (dark)
mix-blend-mode: soft-light (light) / overlay (dark)
pointer-events: none
```
The grain adds analogue warmth and prevents the design from feeling too flat or digital.

### Background Orbs (decorative)
Large blurred circles in the page background:
```css
position: absolute
border-radius: 50%
opacity: 0.05–0.06 (light) / higher in dark
filter: blur(80–120px)
/* colors match section accent: red-glow, purple-tint etc. */
```
Used subtly — they add dimensionality without becoming visual noise.

### Compatibility Score Display
A core product UI pattern worth preserving:
```css
/* Score circle */
font: Geist Mono, 32–48px, weight 700
color: red/green/yellow depending on score
surrounded by emoji category breakdown
layout: centered, 4-column icon grid below score
```

---

## 10. Agent Prompt Guide

### Quick Reference
```
Light background:    #f5f5f7
Dark background:     #0f0f0f
Card (dark):         #141414
Primary text:        rgba(0,0,0,0.92) / #ffffff
Secondary text:      rgba(0,0,0,0.78) / rgba(255,255,255,0.92)
Accent red (light):  #e8352c
Accent red (dark):   #ff3b30
Border (light):      rgba(0,0,0,0.10)
Border (dark):       rgba(255,255,255,0.10)
Default radius:      0.75rem (12px)
Pill radius:         100px
Display font:        Syne
Body font:           DM Sans
Mono font:           Geist Mono
```

### Example Component Prompts

**Hero section:**
> "Full-width hero on `#f5f5f7`. Display heading: Syne 700 clamp(72px,15vw,120px), tight letter-spacing -0.02em, `rgba(0,0,0,0.92)`. Subheading: DM Sans 20px weight 500 `rgba(0,0,0,0.78)`. CTA: pill button (`border-radius:100px`) red `#e8352c`, shadow `0 2px 8px rgba(232,53,44,0.25)`."

**Profile / match card:**
> "Card: `#ffffff` bg, `border-radius: 0.75rem`, `box-shadow: 0 2px 8px rgba(0,0,0,0.06)`. Avatar: circular 64px. Name: Syne 18px weight 700. Score: Geist Mono 48px weight 700 red `#e8352c`. Category icons: 2×2 grid, `rgba(0,0,0,0.78)` labels 13px DM Sans."

**Dark mode nav:**
> "Nav: `#0f0f0f` bg, `border-bottom: 1px solid rgba(255,255,255,0.10)`, `backdrop-filter: blur(12px)`. Logo: Syne 20px weight 700 white. Links: DM Sans 14px weight 500 `rgba(255,255,255,0.70)`, hover white. CTA: pill `#ff3b30` with glow `0 0 24px rgba(255,59,48,0.4)`."

### Style Keywords
- "More premium" → deepen shadow values, add grain overlay, increase blur intensity
- "Lighter/cleaner" → switch to light mode tokens, reduce shadow opacity
- "More social" → increase rounded radius on avatars, add glow to profile elements
- "More editorial" → increase Syne display size, add background orbs, reduce UI density
