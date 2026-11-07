# ParkingFinder 2.0 — Design System Specification

## 1. Design Direction & Brand Identity
**Identity:** Premium Urban Mobility Marketplace  
**Inspirations:**
* **Airbnb:** Marketplace discovery, synchronized map-and-listing interactions, transparent fee presentation.
* **Stripe:** Financial dashboard clarity, monospace transaction references, semantic status badges, restrained high-contrast typography.
* **Linear:** Typography hierarchy, purposeful micro-spacing, keyboard-first interactions, subtle 1px border elevation over diffuse shadows.
* **Apple Maps:** Contextual search overlays, clean geocoding feedback, unobtrusive map controls.

---

## 2. Color Palette & Semantic Tokens

| Token | Hex Code | Purpose & Semantic Role |
| :--- | :--- | :--- |
| **Primary Text** | `#17243A` | High-contrast body, titles, section headings, and data labels |
| **Secondary Text** | `#64748B` | Subtitles, supporting hints, metadata, and breadcrumbs |
| **Muted Text** | `#94A3B8` | Input placeholders, inactive icons, and subtle helper notes |
| **Primary Blue** | `#2563EB` | Primary brand accent, primary CTA buttons, active links, focused inputs |
| **Page Background** | `#F4F6F8` | Canvas background for standard marketing and dashboard routes |
| **Surface (Card)** | `#FFFFFF` | Elevated components, modal dialogues, card tiles, and toolbars |
| **Border / Divider** | `#DDE3EA` | Crisp, structural 1px separation lines across all components |
| **Success / Paid** | `#16845B` | Active listings, paid reservations, confirmed transactions |
| **Warning / Demo** | `#D97706` | Demo reservations, pending transactions, high occupancy warnings |
| **Danger / Error** | `#DC4545` | Cancelled bookings, spot deletion, critical validation alerts |

---

## 3. Typography & Spacing System

### 3.1 Typographic Scale
* **Hero Heading:** 40px – 56px (`text-3xl sm:text-5xl lg:text-6xl`, font-bold, leading-[1.12])
* **Page Heading:** 24px – 32px (`text-xl sm:text-2xl`, font-bold, tracking-tight)
* **Section Heading:** 18px – 20px (`text-base sm:text-lg`, font-semibold)
* **Component Title:** 14px – 16px (`text-sm sm:text-base`, font-semibold)
* **Body Text:** 13px – 14px (`text-xs sm:text-sm`, text-[#475569], leading-relaxed)
* **Caption / Meta:** 11px – 12px (`text-[11px] sm:text-xs`, text-[#64748B])

### 3.2 Spacing & Grid System
* Base increment: 4px.
* Component gutters: 8px, 12px, 16px, 20px, 24px.
* Container Max Widths:
  * Marketing / Details / Dashboards: `max-w-6xl` (1152px) or `max-w-5xl` (1024px), centered with `px-4 sm:px-6`.
  * Map Discovery (`/find`): Full viewport width and height (`h-full w-full overflow-hidden`).

---

## 4. Reusable UI Primitives

1. **`Button` (`frontend/src/components/ui/Button.jsx`)**:
   * Variants: `primary`, `secondary`, `outline`, `ghost`, `danger`.
   * Sizes: `sm` (text-xs, py-1 px-2.5), `md` (text-xs, py-2 px-3.5), `lg` (text-sm, py-2.5 px-5).
   * Polymorphic: Renders as `<Link>` when `href` is supplied; handles `disabled` and loading spinners cleanly.

2. **`Card` (`frontend/src/components/ui/Card.jsx`)**:
   * Pure `#FFFFFF` background with 1px `#DDE3EA` border.
   * Subtle hover elevation (`hover:border-[#CBD5E1]`) without aggressive blurred shadows.
   * Standard paddings: `sm` (12px), `default` (16px–24px), `lg` (24px–32px).

3. **`Badge` & `StatusBadge` (`frontend/src/components/ui/Badge.jsx`)**:
   * Semantic indicator badges for listing and booking statuses:
     * `Paid` / `Confirmed` / `Available` → `#ECFDF5` background with `#16845B` text and indicator dot.
     * `Demo Reserved` / `Pending` → `#FFFBEB` background with `#D97706` text and indicator dot.
     * `Cancelled` / `Failed` → `#FEF2F2` background with `#DC4545` text and indicator dot.

4. **`EmptyState` (`frontend/src/components/ui/EmptyState.jsx`)**:
   * Soft `#F4F6F8` icon container, `#17243A` title, `#64748B` supporting text, and primary action slot.

5. **`PageHeader` (`frontend/src/components/ui/PageHeader.jsx`)**:
   * Standardized editorial header with chevron-separated breadcrumbs, page title, supporting description, and right-aligned action slot.

6. **`Tabs` (`frontend/src/components/ui/Tabs.jsx`)**:
   * Segmented control switcher with subtle border and active pill elevation.

---

## 5. Layout Architecture & Decoupling

* **Full-Viewport Map Shell (`/find`)**:
  * Decoupled from document scrolling: `h-[calc(100vh-65px)] overflow-hidden flex flex-col`.
  * Footer automatically hidden to maximize screen real estate.
  * Desktop: Split-view with left fixed scrollable card list (~440px) and right 100% interactive Leaflet map.
  * Mobile: Fluid segmented control toggle between "List" and "Map" views with automatic Leaflet `map.invalidateSize()`.
* **Standard Editorial Shell (All other routes)**:
  * Minimum 100vh canvas (`min-h-screen bg-[#F4F6F8]`), standardized centered containers, and full corporate footer.
