# ParkingFinder 2.0 — Design System & Visual Specification (`design.md`)

*Design Identity: Premium Urban Mobility Marketplace*  
*Reference Standards: Airbnb (discovery), Stripe (clarity & financial precision), Linear (typography & structural restraint), Apple Maps (contextual geospatial controls).*  
*Supersedes: Legacy Google Stitch prototype.*

---

## 1. Product Vision & Visual Philosophy

ParkingFinder connects urban drivers with verified space hosts and commercial garage operators. The visual system establishes consumer trust and operational clarity:

* **Minimalism with Purpose:** Generous whitespace, disciplined component spacing based on a 4px scale, and meaningful visual grouping.
* **Neutral-First Foundation:** Slate canvas (`#F4F6F8`) and elevated surfaces (`#FFFFFF`) framed by crisp 1px borders (`#DDE3EA`) rather than diffuse ambient drop shadows.
* **Restrained Brand Accents:** Brand blue (`#2563EB`) reserved strictly for primary actions, active navigational indicators, and focus rings.
* **Semantic Indicator Discipline:** Green (`#16845B`) utilized only for confirmed/paid/available states, amber (`#D97706`) for pending/demo states, and red (`#DC4545`) for destructive/cancelled states.
* **Typographic Hierarchy:** High-contrast Inter typeface with clear visual rhythm from hero headlines down to monospace metadata.
* **Decoupled Layout Viewports:** Full-height application viewport on map discovery (`/find`) contrasted with standardized editorial containers on marketing and operational pages.

---

## 2. Core Token Hierarchy

### 2.1 Color Tokens
| Token | Hex Value | Purpose & Semantic Role |
| :--- | :--- | :--- |
| **Primary Text** | `#17243A` | High-contrast headings, card titles, and primary data labels |
| **Secondary Text** | `#64748B` | Subtitles, supporting descriptions, timestamps, and breadcrumbs |
| **Muted Text** | `#94A3B8` | Form placeholders, inactive icons, and subtle helper captions |
| **Primary Blue** | `#2563EB` | Primary brand accent, primary CTA buttons, active links, focus rings |
| **Page Canvas** | `#F4F6F8` | Page viewport background for standard editorial and dashboard routes |
| **Surface Card** | `#FFFFFF` | Elevated components, modal dialogs, map toolbars, and form cards |
| **Border / Divider** | `#DDE3EA` | Crisp structural 1px separation lines across all components |
| **Success / Paid** | `#16845B` | Active listings, paid reservations, confirmed transactions |
| **Success Surface** | `#ECFDF5` | Background tint for success badges and confirmation pills |
| **Warning / Demo** | `#D97706` | Demo reservations, pending transactions, high occupancy warnings |
| **Warning Surface** | `#FFFBEB` | Background tint for pending/warning badges |
| **Danger / Alert** | `#DC4545` | Cancelled bookings, spot deletion, critical validation alerts |
| **Danger Surface** | `#FEF2F2` | Background tint for error badges and destructive confirmations |

### 2.2 Typography Scale
* **Display Hero:** 40px – 56px (`text-3xl sm:text-5xl lg:text-6xl`, font-bold, tracking-tight, leading-[1.12]).
* **Page Heading:** 24px – 32px (`text-xl sm:text-2xl`, font-bold, tracking-tight, text-[#17243A]).
* **Section Heading:** 18px – 20px (`text-base sm:text-lg`, font-semibold, text-[#17243A]).
* **Component Title:** 14px – 16px (`text-sm sm:text-base`, font-semibold, text-[#17243A]).
* **Body Standard:** 13px – 14px (`text-xs sm:text-sm`, text-[#475569], leading-relaxed).
* **Caption / Meta:** 11px – 12px (`text-[11px] sm:text-xs`, text-[#64748B]).
* **Monospace Identifier:** 11px – 12px (`font-mono text-xs`, text-[#334155]).

### 2.3 Elevation, Radius & Borders
* **Elevation Strategy:** Elevation is achieved through background contrast (`#F4F6F8` canvas vs `#FFFFFF` surface) and crisp 1px `#DDE3EA` borders. Diffused multi-layer drop shadows and artificial glows are strictly avoided.
* **Component Radiuses:**
  * Buttons & Inputs: 8px – 10px (`rounded-lg`).
  * Cards & Containers: 12px – 16px (`rounded-xl` to `rounded-2xl`).
  * Modal Dialogs: 16px – 20px (`rounded-2xl`).
  * Badges & Status Indicators: Fully rounded pills (`rounded-full`) only where semantically appropriate.

---

## 3. Modular Component Primitives

### 3.1 Button Primitive (`frontend/src/components/ui/Button.jsx`)
* **Variants:**
  * `primary`: Solid `#2563EB` background with pure `#FFFFFF` text and subtle hover darkening (`hover:bg-blue-700`).
  * `secondary`: Solid `#F1F5F9` background with `#17243A` text and 1px `#E2E8F0` border.
  * `outline`: Transparent background with 1px `#DDE3EA` border and `#17243A` text (`hover:bg-slate-50`).
  * `ghost`: Transparent background with `#64748B` text (`hover:text-[#17243A] hover:bg-slate-100`).
  * `danger`: Solid `#DC4545` background with pure `#FFFFFF` text.
* **Polymorphism:** Automatically renders as React Router `<Link>` when `href` is supplied; handles loading spinner states without layout shifting.

### 3.2 Card Primitive (`frontend/src/components/ui/Card.jsx`)
* Solid `#FFFFFF` surface with 1px `#DDE3EA` border.
* Subtle hover feedback (`hover:border-[#CBD5E1]`) on interactive cards.
* Standard padding options: `sm` (12px), `default` (16px–24px), `lg` (24px–32px).

### 3.3 Badge & StatusBadge (`frontend/src/components/ui/Badge.jsx`)
* Semantic status indicators pairing 2px status dots with high-contrast text:
  * `Paid` / `Confirmed` / `Available`: `#ECFDF5` background with `#16845B` text.
  * `Demo Reserved` / `Pending`: `#FFFBEB` background with `#D97706` text.
  * `Cancelled` / `Failed`: `#FEF2F2` background with `#DC4545` text.

### 3.4 PageHeader (`frontend/src/components/ui/PageHeader.jsx`)
* Standardized editorial header rendering breadcrumbs, page title, descriptive supporting copy, and right-aligned action buttons.

### 3.5 Tabs (`frontend/src/components/ui/Tabs.jsx`)
* Segmented control switcher with subtle border and elevated active pill indicator.

### 3.6 EmptyState (`frontend/src/components/ui/EmptyState.jsx`)
* Accessible illustration container in soft slate, `#17243A` title, supporting explanation, and primary call-to-action button.

---

## 4. Layout Architecture & Viewport Management

### 4.1 Full-Viewport Map Shell (`/find`)
* **Decoupled Viewport:** `h-[calc(100vh-65px)] overflow-hidden flex flex-col`.
* **Automatic Footer Unmounting:** The global footer is automatically hidden to yield 100% of the vertical viewport to map discovery.
* **Desktop Split-View:** Left-hand scrollable card list (~440px fixed width) paired with right-hand interactive Leaflet map canvas.
* **Marker-Card Synchronization:** Hovering or clicking a list card invokes `map.flyTo()` to center the corresponding marker with visual pulse feedback; clicking a map marker automatically highlights and scrolls to the corresponding list card.
* **Mobile Responsive Switcher:** Segmented control toggles between "List" and "Map" views with automatic Leaflet `map.invalidateSize()` invocation to prevent blank tile artifacts.

### 4.2 Standard Editorial Shell (All Other Routes)
* Minimum 100vh canvas (`min-h-screen bg-[#F4F6F8]`), standardized centered containers (`max-w-6xl` or `max-w-5xl`), consistent 4px-grid gutters, and full corporate footer.

---

## 5. Accessibility & Interaction Standards

* **Keyboard Navigation:** Full keyboard focus trapping on modal dialogs (`Escape` key dismisses modal; initial focus placed on primary input).
* **Color Contrast Compliance:** All text-to-background combinations meet or exceed WCAG 2.1 AA standards (minimum 4.5:1 for normal body text and 3:1 for large display text).
* **Semantic HTML:** Native `<header>`, `<nav>`, `<main>`, `<section>`, and `<footer>` landmarks used across all pages.
* **Hardware-Accelerated Motion:** Subtle, purposeful Framer Motion transitions with reduced-motion media query respect.
