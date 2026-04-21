# DESIGN.md — Industrial Metro Aesthetic

> Custom design system for products targeting users who appreciate industrial design,
> modular metro grids, motorcycle/tech culture, and chill understated style.
> NOT for: flashy gradients, neon excess, luxury signaling, or AI-bubble aesthetics.

---

## 1. Visual Theme & Atmosphere

This design system channels the visual language of **industrial workshops, metro transit maps, and precision machinery** — filtered through a chill, understated lifestyle lens. Think CNC-machined aluminum, matte powder-coat finishes, exposed concrete floors, and typographic wayfinding systems. The aesthetic draws from:

- **DIN / German industrial standard** typography — the font of road signs, technical manuals, machine labels
- **Metro modular grids** — tile-based layouts with clear gutters, no organic curves
- **Matte material language** — flat surfaces over glossy, oxidized over polished
- **Functional hardware palette** — anthracite, cement gray, rust orange, matte black, off-white

The interface disappears into the content. No shadows for decoration. No rounded corners for warmth. No gradients for energy. Every visual choice is **earned by function**, not applied for personality. The result: a product that feels like it was designed by engineers who also have taste.

**Not this:**
- ❌ Glowing neon on black (cyberpunk excess)
- ❌ Frosted glass + gradients (generic AI startup look)
- ❌ Big brand luxury signals (Ferrari red, Rolex gold)
- ❌ Playful rounded cards (consumer app friendliness)

**This:**
- ✅ Flat matte surfaces, no decoration
- ✅ Tight uppercase DIN-style type with letter-spacing
- ✅ Metro tile layout — everything on a grid, nothing floats
- ✅ A single accent color used sparingly, like a warning label

---

## 2. Color Palette & Roles

### Primary Surfaces
| Name | Hex | Role |
|---|---|---|
| Void Black | `#0a0a0a` | Primary background, hero sections |
| Forge Dark | `#141414` | Card surfaces, elevated panels |
| Cinder Gray | `#1e1e1e` | Secondary surface, borders |
| Concrete | `#2a2a2a` | Dividers, inactive states |

### Text
| Name | Hex | Role |
|---|---|---|
| Off-White | `#e8e8e4` | Primary text — warm white, not pure |
| Ash | `#9e9e99` | Secondary text, labels, metadata |
| Smog | `#5c5c58` | Disabled, placeholder, muted |

### Accent — Rust Orange
| Name | Hex | Role |
|---|---|---|
| Rust | `#c45c1a` | Primary CTA, active state, emphasis |
| Rust Light | `#e07a3a` | Hover state of primary |
| Rust Dim | `#7a3a0f` | Pressed / active background tint |

> The rust accent evokes: weathered iron, industrial warning markings, vintage motorcycle tank pinstripes.
> Use it like a caution stripe — deliberately, not decoratively.

### Semantic
| Name | Hex | Role |
|---|---|---|
| Signal Green | `#4a7c59` | Success — muted, not celebration |
| Fault Red | `#8b3a3a` | Error — industrial fault indicator |
| Caution Amber | `#7a6020` | Warning — subdued amber |

### Light Mode Variant (optional)
| Name | Hex | Role |
|---|---|---|
| Cement | `#f0ede8` | Background — warm off-white, like poured concrete |
| Iron | `#1a1a1a` | Text on light |
| Oxidized Border | `#d0ccc6` | Borders on light surfaces |

---

## 3. Typography Rules

### Font Stack

**Primary (display + UI):** `DIN Next`, `DIN Pro`, `D-DIN`, `IBM Plex Sans`, `system-ui`, `-apple-system`, `Arial`
**Mono (code, stats, labels):** `IBM Plex Mono`, `Roboto Mono`, `Courier New`, `monospace`

> If loading web fonts, prefer: **IBM Plex Sans** (free, DIN-adjacent, industrial feel with good readability)
> Fallback: Inter works but is too "startup-friendly" — tighten letter-spacing to compensate.

### Type Hierarchy

| Role | Size | Weight | Case | Tracking | Line Height |
|---|---|---|---|---|---|
| Display Hero | 52–64px | 700 | UPPERCASE | +0.06em | 1.0 |
| Section Title | 28–36px | 600 | UPPERCASE | +0.04em | 1.1 |
| Card Heading | 18–22px | 600 | Mixed | +0.02em | 1.2 |
| Body | 15–16px | 400 | Mixed | 0 | 1.6 |
| Label / Badge | 11–13px | 600 | UPPERCASE | +0.08em | 1.2 |
| Mono Data | 13–14px | 400 | — | 0 | 1.4 |
| Caption | 11–12px | 400 | Mixed | +0.01em | 1.5 |

### Principles
- Display text is always **uppercase with positive letter-spacing** — like a stencil on a crate
- Body text is mixed case — legibility over uniformity at reading scale
- **Never use light weights (100–300)** — they look fragile on dark surfaces
- Mono font for numbers, stats, IDs, timestamps — industrial readout aesthetic

---

## 4. Component Stylings

### Buttons

**Primary (Rust)**
```
background: #c45c1a
color: #e8e8e4
border: none
border-radius: 0px (sharp corners, mandatory)
padding: 10px 20px
font: 13px uppercase, weight 600, letter-spacing 0.06em
hover: background #e07a3a
active: background #7a3a0f
```

**Secondary (Ghost)**
```
background: transparent
color: #e8e8e4
border: 1px solid #2a2a2a
border-radius: 0px
padding: 10px 20px
font: 13px uppercase, weight 600, letter-spacing 0.06em
hover: border-color #5c5c58, color #e8e8e4
```

**Tertiary (Text)**
```
background: none
color: #9e9e99
underline: none
hover: color #e8e8e4
```

### Cards / Tiles

```
background: #141414
border: 1px solid #1e1e1e
border-radius: 0px — NEVER rounded
padding: 20–24px
gap between tiles: 1px (tight grid, metro style)
```

Metro tile pattern: cards sit flush against each other with 1px gap (the gap IS the border). Like a subway wall with tiled panels.

### Input Fields

```
background: #0a0a0a
border: 1px solid #2a2a2a
border-radius: 0px
color: #e8e8e4
padding: 10px 14px
font-size: 15px
focus: border-color #c45c1a, outline: none
placeholder: color #5c5c58
```

### Navigation

```
background: #0a0a0a
border-bottom: 1px solid #1e1e1e
height: 48px
logo: uppercase, weight 700, letter-spacing 0.08em, color #e8e8e4
nav links: 12px uppercase, weight 600, letter-spacing 0.06em, color #9e9e99
nav link active: color #e8e8e4
nav link hover: color #e8e8e4
```

### Badges / Tags

```
background: #1e1e1e
color: #9e9e99
border: 1px solid #2a2a2a
border-radius: 0px (or max 2px)
font: 11px uppercase, weight 600, letter-spacing 0.08em
padding: 3px 8px
```

For active/highlighted badges:
```
background: #7a3a0f
color: #e07a3a
border-color: #c45c1a
```

### Dividers / Separators

```
border: none
border-top: 1px solid #1e1e1e
margin: 0 (flush to container edges, not inset)
```

### Data / Stats Display

```
value: IBM Plex Mono, 24–32px, weight 500, color #e8e8e4
label: 11px uppercase, weight 600, letter-spacing 0.08em, color #9e9e99
layout: label above value, or left-aligned label with right-aligned value
```

---

## 5. Layout Principles

### Grid System

**Metro tile grid:**
- Base unit: 8px
- Column grid: 12-column, 24px gutters
- Card grid: fixed-width tiles, 1px gap (the gap is the separator)
- Sections: full-width, no max-width artificial constraint at hero level

**Spacing scale:** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128

### Layout Rules
- **Section rhythm:** full-width dark sections alternate with content grids. No "floating" layouts — everything is anchored to the grid.
- **No cards with drop shadows** — depth through border contrast only
- **No background decorations** — no geometric shapes, blobs, or textures behind content
- **Edge-to-edge headers** — navigation and hero sections span full width
- **Tight gutters** — information-dense, not airy. Metro maps don't have padding.

### Whitespace Philosophy
- Whitespace is **structural, not decorative** — it creates hierarchy, not mood
- Use large whitespace to separate major sections (80–128px)
- Within sections, keep spacing tight (16–24px)
- **No centered body text** — left-aligned always, except hero display lines

---

## 6. Depth & Elevation

| Level | Surface | Treatment |
|---|---|---|
| Ground | `#0a0a0a` | Page background |
| Raised | `#141414` | Cards, panels |
| Float | `#1e1e1e` | Dropdowns, tooltips |
| Border | `#2a2a2a` | Container edges |

**Shadow system:** None. Depth is created entirely through surface color stepping (`0a → 14 → 1e → 2a`). Shadows suggest softness — this system is hard-edged.

Only exception: focus ring uses `box-shadow: 0 0 0 2px #c45c1a` for accessibility.

---

## 7. Do's and Don'ts

### ✅ Do
- **Zero border-radius everywhere** — sharp corners, always, no exceptions
- **Uppercase for labels and headings** with positive letter-spacing
- Use the **rust accent sparingly** — one primary action per view
- **Mono font for numbers** — stats, timestamps, IDs, rankings
- **1px gap metro grid** — tiles sit flush with 1px separation
- Keep text **left-aligned** — industrial manuals don't center their labels
- Use **400/600/700** weights only — no 300 (fragile), no 500 (indecisive)

### ❌ Don't
- Don't round corners — this is the #1 rule
- Don't use gradients — flat surfaces only
- Don't use glow effects — this isn't cyberpunk
- Don't add decorative shapes or background patterns
- Don't use pure white (`#ffffff`) — always off-white (`#e8e8e4`) for warmth
- Don't use medium gray for text — it washes out on dark backgrounds
- Don't exceed one accent color usage per section — rust is a signal, not decoration
- Don't make cards "float" with shadows — ground everything

---

## 8. Responsive Behavior

### Breakpoints
| Name | Width | Notes |
|---|---|---|
| Mobile | < 640px | Single column, full-width tiles |
| Tablet | 640–1024px | 2-column tiles |
| Desktop | 1024–1440px | Standard layout |
| Wide | > 1440px | Max content width 1280px, centered |

### Collapsing Strategy
- Metro grid: 3–4 columns → 2 columns → 1 column
- Navigation: horizontal → hamburger (same dark surface, 1px border)
- Hero text: scales down, remains uppercase
- Data tables: horizontal scroll, don't collapse columns
- Touch targets: minimum 44px height

---

## 9. Agent Prompt Guide

### Quick Color Reference
```
Background:     #0a0a0a (Void Black)
Card surface:   #141414 (Forge Dark)
Borders:        #1e1e1e / #2a2a2a
Primary text:   #e8e8e4 (Off-White)
Secondary text: #9e9e99 (Ash)
Accent:         #c45c1a (Rust Orange)
Accent hover:   #e07a3a
Font:           IBM Plex Sans / DIN / system-ui
Mono:           IBM Plex Mono
Border radius:  0px (always)
Shadows:        None
```

### Example Component Prompts

**Hero section:**
> "Full-width hero on `#0a0a0a`. Heading: 52px IBM Plex Sans, weight 700, UPPERCASE, letter-spacing 0.06em, color `#e8e8e4`. Subheading: 16px, weight 400, color `#9e9e99`. CTA button: rust `#c45c1a`, 0px border-radius, 13px uppercase. No gradients, no images."

**Leaderboard / ranking card:**
> "Metro tile grid with 1px gaps (`#1e1e1e`). Each tile: `#141414` background, 0px radius. Rank number: IBM Plex Mono 24px weight 700 `#e8e8e4`. Player name: 15px weight 600. Stats: mono 13px `#9e9e99`. Active row: left border 2px `#c45c1a`."

**Navigation:**
> "Nav: `#0a0a0a` bg, 1px bottom border `#1e1e1e`, 48px height. Logo: uppercase weight 700 letter-spacing 0.08em. Links: 12px uppercase weight 600 letter-spacing 0.06em color `#9e9e99`, hover `#e8e8e4`. No rounded elements."

**Data badge:**
> "Badge: `#1e1e1e` bg, 1px border `#2a2a2a`, 0px radius, 11px uppercase weight 600 letter-spacing 0.08em, color `#9e9e99`. Active/highlighted badge: bg `#7a3a0f`, border `#c45c1a`, color `#e07a3a`."

### Style Keywords (for iteration)
- "More industrial" → increase letter-spacing, more uppercase labels
- "Less harsh" → switch to light mode (cement background), same rules apply
- "More data-dense" → tighten spacing to 8px gaps, add mono data rows
- "More chill" → add more whitespace between sections, reduce text weight to 400
