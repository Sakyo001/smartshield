# SmartShield — UI/UX Revision Guide

> **How to use this file:** Start here before touching any component. Each section maps the current non-compliant patterns to the exact HeroSection design system fix. Work top-down — highest priority components first. Reference `UI_UX_VALIDATOR.md` for the complete design system rules.
>
> **Source of truth:** `apps/web/src/app/components/sections/HeroSection.tsx`

---

## Priority Order

| Priority | Component | Severity | Reason |
|---|---|---|---|
| 🔴 1 | `FAQSection.tsx` | **Critical** | Completely hardcoded, breaks dark mode |
| 🔴 2 | `AIBanner.tsx` | **High** | Wrong brand colour `#6B7FFF`, no `dark:` variants |
| 🟠 3 | `FeatureGrid.tsx` | **Medium** | Wrong primary colour usage, no glassmorphism, no dark pairs |
| 🟠 4 | `HowItWorks.tsx` | **Medium** | Same issues as FeatureGrid |
| 🟡 5 | `CTASection.tsx` | **Low-Medium** | Button missing gradient/shimmer/arrow; bare-bones theming |
| 🟡 6 | `ScanTab.tsx` | **Low** | Wrong accent `#7B83FF`, hardcoded `bg-gray-800`, `#212136` |
| ✅ — | `Navbar.tsx` | Compliant | Passes design system check |
| ✅ — | `Footer.tsx` | Compliant | Passes design system check |
| ✅ — | `HeroSection.tsx` | Reference | This is the standard |

---

## Shared Fixes (Apply Everywhere)

Before touching individual components, understand these 3 universal rules derived from the HeroSection. Every component you revise must comply with all three.

### Rule A — Correct Colour Hierarchy

```
PRIMARY (actions, borders, glows): #545BFF
MID     (gradients, hover):        #6B73FF
LIGHT   (hover text on dark):      #7c83ff
PURPLE  (gradient endpoint):       #b19eef
MUTED   (dark-mode badge text):    #a89de8
```

**The current bug in most components:** `#6B73FF` is being used as the primary instead of `#545BFF`. `#6B73FF` is the gradient midpoint only — it must not be the sole accent colour on badges, dots, borders, or icon containers.

**Wrong:**
```tsx
className="bg-[#6B73FF]/10 border-[#6B73FF]/20 text-[#6B73FF]"
```
**Correct badge:**
```tsx
className="dark:bg-[#545BFF]/10 bg-[#545BFF]/12 dark:border-[#545BFF]/20 border-[#545BFF]/30 border backdrop-blur-sm shadow-sm dark:shadow-none"
```
**Badge text:**
```tsx
className="text-[#545BFF] dark:text-[#a89de8]"
```

---

### Rule B — Every Colour Must Have a Dark Pair

```tsx
// ✅
className="bg-white/80 dark:bg-[#0d0e1a]/60"
className="border-[#545BFF]/30 dark:border-[#545BFF]/20"
className="shadow-sm dark:shadow-none"

// ❌ — breaks light mode or dark mode
className="bg-[#0d0e1a]/60"
className="text-gray-900 dark:text-black"
```

---

### Rule C — Glass Card Standard

Every card-like surface must follow this template:

```tsx
className="group relative overflow-hidden rounded-xl md:rounded-2xl border border-[#545BFF]/20
  dark:bg-[#0d0e1a]/60 bg-white/80 backdrop-blur-md
  hover:border-[#545BFF]/55 dark:hover:bg-[#545BFF]/10 hover:bg-[#545BFF]/6
  transition-all duration-300
  shadow-[0_1px_10px_rgba(84,91,255,0.08),0_2px_6px_rgba(0,0,0,0.05)] dark:shadow-none"
```

Feature cards (FeatureGrid) get `rounded-3xl` and `bg-panel` instead — see §FeatureGrid below.

---

## Component-by-Component Revision

---

### 🔴 1. FAQSection.tsx
**File:** `apps/web/src/app/components/sections/FAQSection.tsx`

**Current critical issues:**
- `bg-white dark:bg-white` — forces white in both modes; completely wrong
- `text-gray-900 dark:text-black` — hardcoded, ignores semantic tokens
- `text-gray-500` — use `text-faded` instead
- `text-gray-600 dark:text-gray-600` — use `text-copy/80` instead
- `border-gray-200 dark:border-gray-200` — use `border-divider` instead
- `border-gray-100 dark:border-gray-100` — use `border-divider/50` instead
- Zero semantic tokens used in the entire component
- Badge colour: `text-[#6B73FF] bg-[#6B73FF]/5 border-[#6B73FF]/10` → must migrate to `#545BFF` pattern

**Fixes — section wrapper:**
```tsx
// ❌ Current
<section className="py-16 ... bg-white dark:bg-white">

// ✅ Fixed
<section className="py-16 md:py-24 px-4 md:px-6 bg-page relative overflow-hidden">
```

**Fixes — badge:**
```tsx
// ❌ Current
<div className="bg-[#6B73FF]/5 border border-[#6B73FF]/10 ...">
  <span className="text-[#6B73FF] font-bold tracking-wide text-xs uppercase">

// ✅ Fixed
<div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full
  dark:bg-[#545BFF]/10 bg-[#545BFF]/12 dark:border-[#545BFF]/20 border-[#545BFF]/30 border
  backdrop-blur-sm shadow-sm dark:shadow-none mb-5">
  <span className="w-1.5 h-1.5 rounded-full bg-[#545BFF] animate-pulse" />
  <span className="text-[#545BFF] dark:text-[#a89de8] text-[11px] font-semibold tracking-widest uppercase">
```

**Fixes — headings:**
```tsx
// ❌ Current
<h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 ...">

// ✅ Fixed
<h2 className="text-[1.7rem] sm:text-3xl md:text-[2.75rem] font-extrabold text-heading tracking-tight leading-[1.1]">
  Frequently{" "}
  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#545BFF] to-[#b19eef]">
    Asked
  </span>
</h2>
```

**Fixes — body text:**
```tsx
// ❌ Current
<p className="text-gray-500 text-lg ...">
// ✅ Fixed
<p className="text-copy/80 text-base md:text-lg leading-relaxed">

// ❌ Question text
className="text-gray-900 dark:text-black font-medium ..."
// ✅ Fixed
className="text-heading font-semibold text-base"

// ❌ Answer text
className="text-gray-600 dark:text-gray-600 ..."
// ✅ Fixed
className="text-copy/80 text-sm md:text-base leading-relaxed"
```

**Fixes — FAQ item wrapper:**
```tsx
// ❌ Current
className="border border-gray-200 dark:border-gray-200 rounded-lg"

// ✅ Fixed
className="group border border-[#545BFF]/15 dark:border-[#545BFF]/15 border-divider
  rounded-xl dark:bg-[#0d0e1a]/40 bg-white/70 backdrop-blur-md
  hover:border-[#545BFF]/40 transition-all duration-300
  shadow-[0_1px_6px_rgba(84,91,255,0.06)] dark:shadow-none"
```

**Fixes — toggle icon button:**
```tsx
// ❌ Current  
className="bg-gradient-to-br from-[#6B73FF] to-[#5A62E8]"

// ✅ Fixed
className="bg-gradient-to-br from-[#545BFF] to-[#6B73FF]
  shadow-[0_0_12px_rgba(84,91,255,0.35)] group-hover:shadow-[0_0_20px_rgba(84,91,255,0.55)]"
```

---

### 🔴 2. AIBanner.tsx
**File:** `apps/web/src/app/components/sections/AIBanner.tsx`

**Current issues:**
- Wrong primary colour: `#6B7FFF` used throughout — must be `#545BFF`/`#6B73FF`
- No `dark:` variant on any colour
- Main card is `bg-panel` — acceptable, but must add glassmorphism and dark pair
- Badge uses `bg-heading/5 border-heading/10` — switch to standard `#545BFF` pill

**Fixes — brand colour sweep (`#6B7FFF` → `#545BFF`):**

Every instance of `#6B7FFF` must be replaced:
```
text-[#6B7FFF]           → text-[#545BFF] dark:text-[#a89de8]  (badge text)
bg-[#6B7FFF]/20          → dark:bg-[#545BFF]/15 bg-[#545BFF]/12  (checkmark circle)
group-hover/item:bg-[#6B7FFF] → group-hover/item:bg-[#545BFF]
bg-[#6B7FFF]/10          → bg-[#545BFF]/10  (ambient glow)
from-[#6B7FFF]           → from-[#545BFF]   (gradient text)
bg-gradient-to-tr from-[#6B7FFF]/5 → from-[#545BFF]/5
```

**Fixes — badge:**
```tsx
// ❌ Current
<div className="inline-block px-3 py-1 rounded-full bg-heading/5 border border-heading/10 backdrop-blur-sm">
  <span className="text-xs font-semibold text-[#6B7FFF] uppercase tracking-wider">

// ✅ Fixed
<div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full
  dark:bg-[#545BFF]/10 bg-[#545BFF]/12 dark:border-[#545BFF]/20 border-[#545BFF]/30 border
  backdrop-blur-sm shadow-sm dark:shadow-none mb-5">
  <span className="w-1.5 h-1.5 rounded-full bg-[#545BFF] animate-pulse" />
  <span className="text-[#545BFF] dark:text-[#a89de8] text-[11px] font-semibold tracking-widest uppercase">
```

**Fixes — heading:**
```tsx
// ❌ Current
<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-heading ...">

// ✅ Fixed — make extrabold + gradient on 1-2 words
<h2 className="text-[1.7rem] sm:text-3xl md:text-[2.75rem] font-extrabold text-heading tracking-tight leading-[1.1]">
```

---

### 🟠 3. FeatureGrid.tsx
**File:** `apps/web/src/app/components/sections/FeatureGrid.tsx`

**Current issues:**
- Badge and badge text uses `#6B73FF` as primary — migrate to `#545BFF`
- Section badge uses `bg-[#6B73FF]/5 border-[#6B73FF]/10` — migrate to hero pill pattern
- Feature cards have zero `dark:` variants — they use `bg-panel border-divider` which adapts via semantic token, but hover states have no dark pairing
- `hover:border-[#6B73FF]/30` and `hover:shadow-[#6B73FF]/10` is acceptable for feature cards (`#6B73FF` is the mid hover accent)
- Number badge: `from-[#6B73FF] to-[#8a9dff]` — change `#8a9dff` to `#b19eef` (our purple token)
- Section `h2`: `text-3xl md:text-5xl font-extrabold` missing `tracking-tight leading-tight`
- Gradient span on h2: `text-[#6B73FF]` — must be a proper gradient span
- No glassmorphism on any card (acceptable for feature cards — `bg-panel` is fine)

**Fixes — section badge:**
```tsx
// ❌ Current
<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6B73FF]/5 border border-[#6B73FF]/10 mb-6">
  <span className="w-2 h-2 rounded-full bg-[#6B73FF] animate-pulse" />
  <span className="text-[#6B73FF] font-bold tracking-wide text-xs uppercase">

// ✅ Fixed
<div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full
  dark:bg-[#545BFF]/10 bg-[#545BFF]/12 dark:border-[#545BFF]/20 border-[#545BFF]/30 border
  backdrop-blur-sm shadow-sm dark:shadow-none mb-6">
  <span className="w-1.5 h-1.5 rounded-full bg-[#545BFF] animate-pulse" />
  <span className="text-[#545BFF] dark:text-[#a89de8] text-[11px] font-semibold tracking-widest uppercase">
```

**Fixes — section heading:**
```tsx
// ❌ Current
<h2 className="text-3xl md:text-5xl font-extrabold text-heading">
  ...
  <span className="text-[#6B73FF]">word</span>

// ✅ Fixed
<h2 className="text-[1.7rem] sm:text-3xl md:text-[2.75rem] font-extrabold text-heading tracking-tight leading-[1.1]">
  ...
  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#545BFF] to-[#b19eef]">word</span>
```

**Fixes — number badge gradient:**
```tsx
// ❌ Current
className="bg-gradient-to-r from-[#6B73FF] to-[#8a9dff]"
// ✅ Fixed
className="bg-gradient-to-r from-[#545BFF] to-[#6B73FF]
  shadow-[0_0_14px_rgba(84,91,255,0.40)]"
```

**Fixes — card h3 hover colour:**
```tsx
// ❌ Current
className="group-hover:text-[#6B73FF]"
// ✅ Fixed
className="dark:group-hover:text-[#7c83ff] group-hover:text-[#545BFF] transition-colors duration-300"
```

---

### 🟠 4. HowItWorks.tsx
**File:** `apps/web/src/app/components/sections/HowItWorks.tsx`

**Current issues:** Same pattern as FeatureGrid — `#6B73FF` used as primary everywhere.

Apply the same fixes as FeatureGrid §3 above:
- Badge: match hero pill pattern with `#545BFF`
- Heading: `font-extrabold tracking-tight leading-[1.1]` + gradient span
- Number badge: `from-[#545BFF] to-[#6B73FF]` + glow shadow
- Step card h3 hover: `dark:group-hover:text-[#7c83ff] group-hover:text-[#545BFF]`

**Additional specific fix — timeline dot:**
```tsx
// ❌ Current
className="border-4 border-[#6B73FF]"
// ✅ Fixed
className="border-4 border-[#545BFF] shadow-[0_0_14px_rgba(84,91,255,0.50)]"
```

**Additional specific fix — timeline line:**
```tsx
// ❌ Current
className="bg-gradient-to-b from-[#6B73FF]/20 via-[#6B73FF]/40 to-[#6B73FF]/20"
// ✅ Fixed
className="bg-gradient-to-b from-[#545BFF]/20 via-[#545BFF]/40 to-[#545BFF]/20"
```

**Additional specific fix — step cards (add glassmorphism for consistency):**
```tsx
// ❌ Current
className="... bg-panel rounded-2xl ... border border-divider"
// ✅ Fixed — keep bg-panel but add hover glassmorphism
className="... dark:bg-panel bg-white/90 rounded-2xl border border-divider/60
  hover:border-[#545BFF]/30 backdrop-blur-sm
  dark:hover:bg-[#545BFF]/5 hover:bg-[#545BFF]/4
  transition-all duration-300"
```

---

### 🟡 5. CTASection.tsx
**File:** `apps/web/src/app/components/sections/CTASection.tsx`

**Current issues:**
- Primary button is bare `bg-[#545BFF]` — missing gradient, shimmer, and arrow icon
- Button glow exists but is weak `shadow-[0_0_15px...]` — hero uses `0_0_24px` → `0_0_40px` on hover
- No section badge
- Heading is `font-bold` — should be `font-extrabold`
- No gradient text on heading

**Fixes — primary button:**
```tsx
// ❌ Current
<button className="... bg-[#545BFF] hover:bg-[#4349CC] text-white rounded-full
  shadow-[0_0_15px_rgba(84,91,255,0.4)] font-medium">
  Get the Extension
</button>

// ✅ Fixed
<Link
  href="https://chromewebstore.google.com/detail/smartshield/fggfmmhccdeaahhoihgohdjikfobmeeg"
  target="_blank" rel="noopener noreferrer"
  className="group relative px-8 h-12 inline-flex items-center justify-center
    bg-gradient-to-r from-[#545BFF] to-[#6B73FF]
    hover:from-[#4349dd] hover:to-[#545BFF]
    text-white text-sm font-semibold rounded-full
    shadow-[0_0_24px_rgba(84,91,255,0.42)]
    hover:shadow-[0_0_40px_rgba(84,91,255,0.65)]
    hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
>
  <span className="relative z-10 flex items-center gap-2">
    Get the Extension
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className="group-hover:translate-x-0.5 transition-transform duration-200" aria-hidden>
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  </span>
  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full
    transition-transform duration-700
    bg-gradient-to-r from-transparent via-white/15 to-transparent" />
</Link>
```

**Fixes — add section badge above heading:**
```tsx
<div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full
  dark:bg-[#545BFF]/10 bg-[#545BFF]/12 dark:border-[#545BFF]/20 border-[#545BFF]/30 border
  backdrop-blur-sm shadow-sm dark:shadow-none mb-5">
  <span className="relative flex h-1.5 w-1.5">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#545BFF] opacity-75" />
    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#545BFF]" />
  </span>
  <span className="text-[#545BFF] dark:text-[#a89de8] text-[11px] font-semibold tracking-widest uppercase">
    Start Protecting Now
  </span>
</div>
```

**Fixes — heading:**
```tsx
// ❌ Current
<h2 className="text-3xl md:text-5xl font-bold text-heading">

// ✅ Fixed
<h2 className="text-[1.7rem] sm:text-3xl md:text-[2.75rem] font-extrabold text-heading tracking-tight leading-[1.1]">
  Stay{" "}
  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#545BFF] to-[#b19eef]">
    Protected
  </span>
  {" "}Online
</h2>
```

---

### 🟡 6. ScanTab.tsx
**File:** `apps/web/src/app/components/sections/ScanTab.tsx`

> ScanTab is a complex functional component — colour fixes only. Do not restructure its logic.

**Current issues:**
- `#7B83FF` used as an accent — must be `#545BFF` (primary) or `#6B73FF` (mid)
- `bg-gray-800 text-gray-400` on disabled scan button — must use semantic tokens
- `#212136` hardcoded on Sign In button — use `bg-inset`
- `placeholder-gray-500` on input — use `placeholder:text-faded`
- Active tab highlight: `bg-[#7B83FF]` → `bg-[#545BFF]`
- XAI spinner: `border-t-2 border-[#7B83FF]` → `border-t-[#545BFF]`

**Fixes — colour sweep (`#7B83FF` → `#545BFF`):**
```
Active tab:       bg-[#7B83FF] → bg-[#545BFF]
                  shadow-[#7B83FF]/25 → shadow-[#545BFF]/25
                  focus:ring-[#7B83FF]/50 → focus:ring-[#545BFF]/50
XAI spinner:      border-t-2 border-[#7B83FF] → border-[#545BFF]
WHOIS icon:       text-[#7B83FF] → text-[#545BFF]
DNS icons/border: text-[#b19eef] border-[#b19eef]/30 ✅ keep — purple is correct here
```

**Fixes — disabled button:**
```tsx
// ❌ Current
className="... bg-gray-800 text-gray-400"
// ✅ Fixed
className="... bg-inset text-faded cursor-not-allowed"
```

**Fixes — placeholder:**
```tsx
// ❌ Current
className="... placeholder-gray-500"
// ✅ Fixed
className="... placeholder:text-faded"
```

**Fixes — hardcoded Sign In button background:**
```tsx
// ❌ Current
className="... hover:bg-[#212136] ..."
// ✅ Fixed
className="... hover:bg-inset ..."
```

**Fixes — section badge:**
```tsx
// ❌ Current
<div className="... bg-[#6B73FF]/10 border-[#6B73FF]/20 ...">
  <span className="text-[#6B73FF] ...">

// ✅ Fixed — use standard hero pill
  dark:bg-[#545BFF]/10 bg-[#545BFF]/12 dark:border-[#545BFF]/20 border-[#545BFF]/30 border
  text-[#545BFF] dark:text-[#a89de8]
```

---

## Section Header Template

Every section that has a heading must follow this exact structure. Copy-paste and swap the text:

```tsx
{/* Section opener — used in every section */}
<div className="text-center mb-12 md:mb-16">
  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full
    dark:bg-[#545BFF]/10 bg-[#545BFF]/12
    dark:border-[#545BFF]/20 border-[#545BFF]/30 border
    backdrop-blur-sm shadow-sm dark:shadow-none mb-5">
    <span className="w-1.5 h-1.5 rounded-full bg-[#545BFF] animate-pulse" />
    <span className="text-[#545BFF] dark:text-[#a89de8] text-[11px] font-semibold tracking-widest uppercase">
      Section Label
    </span>
  </div>
  <h2 className="text-[1.7rem] sm:text-3xl md:text-[2.75rem] font-extrabold text-heading tracking-tight leading-[1.1] mb-4">
    Normal words{" "}
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#545BFF] to-[#b19eef]">
      gradient word
    </span>
  </h2>
  <p className="text-copy/80 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
    Subtitle text here.
  </p>
</div>
```

---

## Ambient Background Template

Every section should have a subtle background glow. Copy-paste into the section's relative container:

```tsx
{/* Ambient glow — standard for all sections */}
<div className="absolute inset-0 pointer-events-none overflow-hidden">
  <div className="absolute top-[10%] right-[5%] w-72 h-72 md:w-96 md:h-96 rounded-full bg-[#545BFF]/8 blur-[100px]" />
  <div className="absolute bottom-[10%] left-[5%] w-72 h-72 md:w-96 md:h-96 rounded-full bg-[#b19eef]/6 blur-[100px]" />
</div>
```

---

## Revision Checklist

Use this for every component you revise. Check off each item before moving to the next component.

### Per-component checklist

**Colours**
- [ ] No `#6B73FF` used as sole primary — only as gradient midpoint
- [ ] No `#6B7FFF`, `#7B83FF`, `#8a9dff` — these are wrong variants
- [ ] No `text-gray-*`, `bg-gray-*`, `border-gray-*` — use semantic tokens
- [ ] `bg-white` and `text-black` are banned — use `bg-page`, `bg-white/80`, `text-heading`
- [ ] Every hardcoded colour has a `dark:` counterpart

**Section opener**
- [ ] Badge follows the pill pattern with `#545BFF` colours (§Section Header Template above)
- [ ] H2 is `font-extrabold tracking-tight leading-[1.1]`
- [ ] H2 has 1–2 gradient words (`from-[#545BFF] to-[#b19eef]`)
- [ ] Subtitle uses `text-copy/80` with Poppins if available

**Cards / Panels**
- [ ] Dark: `dark:bg-[#0d0e1a]/60` | Light: `bg-white/80` (glass cards)
- [ ] OR: `bg-panel` for feature-card size panels (FeatureGrid / HowItWorks)
- [ ] `backdrop-blur-md` on glass cards
- [ ] `shadow-[...] dark:shadow-none` for light mode lift
- [ ] Border `border-[#545BFF]/20` on glass cards; `border-divider` on panel cards
- [ ] Left accent bar `bg-gradient-to-b from-[#545BFF] to-[#b19eef]` on stat/data cards

**Buttons**
- [ ] Primary: gradient + glow shadow + shimmer span + arrow icon
- [ ] Secondary: glass border `border-[#545BFF]/40 dark:border-divider/40` + hover fill + arrow icon
- [ ] Both: `rounded-full h-11`, `hover:-translate-y-0.5`, `transition-all duration-300`

**Ambient background**
- [ ] Section has at least one ambient glow blob (`blur-[100px] rounded-full`)
- [ ] Section wrapper has `relative overflow-hidden` to contain glow

**Typography**
- [ ] Headings: `text-heading font-extrabold tracking-tight`
- [ ] Body: `text-copy/80`–`text-copy/85` (with Poppins if available)
- [ ] Labels/faded text: `text-faded`
- [ ] Gradient text: only on 1–2 words of a heading

**Interaction**
- [ ] All interactive cards have `transition-all duration-300`
- [ ] Hover states change border opacity and background
- [ ] Entrance animations use `initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}`
- [ ] Stagger delays: badge 0.1, heading 0.2, body 0.35, buttons 0.5

---

## Quick Reference — Forbidden Patterns

These specific strings must never appear in any revised component:

```
bg-white dark:bg-white          → bg-page or bg-white/80 dark:bg-[#0d0e1a]/60
text-gray-900                   → text-heading
text-gray-500                   → text-faded
text-gray-600                   → text-copy/80
border-gray-200                 → border-divider or border-[#545BFF]/20
border-gray-100                 → border-divider/50
bg-gray-800                     → bg-inset
text-gray-400 (on buttons)      → text-faded
[#6B7FFF]                       → [#545BFF] (wrong hex)
[#7B83FF]                       → [#545BFF] (wrong hex)
[#8a9dff]                       → [#b19eef] (use our purple token)
[#212136]                       → bg-inset or bg-panel
placeholder-gray-500            → placeholder:text-faded
font-bold (on H1/H2)            → font-extrabold
font-medium (on primary button) → font-semibold
```
