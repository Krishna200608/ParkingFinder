# ParkingFinder 2.0 — Google Stitch Design System Specification (`design.md`)

*Generated & Styled via Google Stitch (Google Labs AI-Native Design Canvas)*
*Last Updated: 2026-11-07*

---

## 1. Product Vision & Vibe Architecture

**Vibe Definition:**
> *High-Velocity Urban Mobility • Effortless Precision • Transparent Reliability*

ParkingFinder bridges urban drivers with private space hosts and commercial garage operators. The visual language balances high-tech speed with approachable consumer trust:
- **Clean Architectural Geometry:** Generous whitespace, `rounded-2xl` to `rounded-3xl` container radiuses, and subtle inner borders (`border-slate-100`).
- **Glassmorphism & Depth:** Layered translucent surfaces (`backdrop-blur-xl bg-white/80`) paired with diffused ambient drop shadows (`shadow-[0_8px_30px_rgb(0,0,0,0.04)]`).
- **Dynamic Feedback:** Instant visual confirmation on every interaction — hover card elevations, tab indicators, synchronized map markers, and status badges.

---

## 2. Core Token Hierarchy

### 2.1 Color Tokens
| Token | Hex / Class | Semantic Purpose |
| :--- | :--- | :--- |
| **Brand Primary** | `#3b82f6` (`blue-600`) → `#4f46e5` (`indigo-600`) | Primary actions, brand logos, active states, key emphasis |
| **Brand Accent** | `#06b6d4` (`cyan-500`) | Dynamic pricing simulations, real-time indicators |
| **Surface Ground** | `#f8fafc` (`slate-50`) | Full page viewport background |
| **Surface Card** | `#ffffff` (`white`) | Elevated cards, dialogs, drawers |
| **Surface Glass** | `rgba(255, 255, 255, 0.85)` | Sticky navigation bars, floating search containers |
| **Text Primary** | `#0f172a` (`slate-900`) | Headings, hero display titles, emphasized numbers |
| **Text Muted** | `#64748b` (`slate-500`) | Subtitles, helper text, timestamps |
| **Success / Verified** | `#10b981` (`emerald-500`) | Paid reservations, verified hosts, active bays |
| **Warning / Demo** | `#f59e0b` (`amber-500`) | Pending actions, unpaid demo reservations, high demand |
| **Danger / Alert** | `#ef4444` (`rose-500`) | Cancellation warnings, conflict errors, delete actions |

### 2.2 Typography Scale
- **Display Hero:** `text-5xl md:text-7xl font-extrabold tracking-tight` (letter-spacing `-0.03em`)
- **Section Heading:** `text-3xl md:text-4xl font-bold text-slate-900 tracking-tight`
- **Card Title:** `text-lg font-semibold text-slate-800`
- **Body Standard:** `text-sm text-slate-600 leading-relaxed`
- **Micro-Caps Pill:** `text-[11px] font-bold uppercase tracking-wider`
- **Code / Reference:** `font-mono text-xs text-slate-700`

### 2.3 Elevation & Shadows
- **Level 1 (Subtle):** `shadow-sm border border-slate-100` (List items, filters)
- **Level 2 (Elevated):** `shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80` (Cards, map cards)
- **Level 3 (Modal / Floating):** `shadow-2xl border border-slate-200/60` (Booking modal, search bar)
- **Glow Accent:** `shadow-[0_0_25px_rgba(59,130,246,0.35)]` (Primary CTAs, live pulse dots)

---

## 3. Stitch Component System

### 3.1 Sticky Glassmorphic Navbar (`Header.jsx`)
- Blur ratio: `backdrop-blur-xl bg-white/80 border-b border-slate-200/60`.
- Dual branding: Logo icon with gradient fill + crisp typography + live pill badge.
- Interactive route pills with hover indicator and active weight.
- Role badges: Distinct pill tags for `Host` vs `Driver`.
- Mobile responsive sheet with smooth slide-over navigation.

### 3.2 High-Conversion Landing Page (`HomePage.jsx`)
- **Stitch Hero Section:**
  - Floating pill: `✨ Google Stitch UI 2.0 • Real-Time Urban Parking Marketplace`
  - Integrated Quick Search Box (address lookup with direct jump to `/find`).
  - Key Performance Metric Ticker (9+ Live Metro Hubs, $0 Free-Tier Host Listing, 100% Concurrency Safe).
- **Dual Perspective Stepper:**
  - Interactive tab toggle: *For Drivers (Find, Reserve, Navigate)* vs *For Hosts (List, Earn, Automate)*.
- **Bento Grid Features:**
  - 4 high-impact feature cards with gradient pill icons, micro-copy, and hover scale transitions.
- **Dynamic Pricing & Heatmap Teaser:**
  - Visual preview card linking directly to `/pricing` and `/find`.
- **Verified Social Proof:**
  - Testimonial cards with star ratings and verified driver identities.

### 3.3 Discovery Canvas (`MapPage.jsx`)
- Split viewport: responsive sticky Leaflet map with customized pulse markers and synchronized card hover state.
- Floating search bar with Nominatim geocoding and 450ms debounce.
- Bottom/side drawer for multi-variable filtering (vehicle size, price slider, EV charging, CCTV, covered).
- Demand heatmap toggle with vivid gradient overlay.

### 3.4 Transaction & Reservation Hub (`DashboardPage.jsx`)
- Tabbed dual-view: *My Reservations* and *Payment Receipts*.
- Live status badges:
  - `Paid` (Emerald badge with Stripe intent reference)
  - `Demo Reserved` (Indigo badge with instant "Pay with Stripe" CTA)
  - `Cancelled` (Rose badge with full audit trail)

### 3.5 Global Footer (`Footer.jsx`)
- Clean modern gradient or slate surface.
- Platform Health Indicator: `🟢 All Systems Operational • Vercel Edge Cloud`.
- Categorized navigation links and open-source GitHub link.

---

## 4. Accessibility & Micro-Interactions
- Full keyboard tab navigation on all interactive elements.
- ARIA landmarks on Header (`<header>`), Navigation (`<nav>`), Main (`<main>`), and Footer (`<footer>`).
- Contrast ratios meeting WCAG 2.1 AA (minimum 4.5:1 for body copy).
- Smooth Framer Motion transitions (`easeOut`, 0.3s - 0.5s duration).

