# ParkingFinder 2.0 — Project Overview

## 1. Executive Summary

ParkingFinder is a full-stack, two-sided parking marketplace designed to connect drivers seeking urban parking spaces with space owners (hosts and facility operators) listing available spots. The platform eliminates urban parking friction, reduces vehicle emissions caused by circling for spaces, and enables property owners to monetize idle driveways, garages, and commercial bays.

This platform transforms an initial proof-of-concept into a production-grade, enterprise-ready marketplace demonstrating advanced full-stack engineering:
* Concurrency-safe booking locks using transactional document serialization.
* Geospatial 2dsphere indexing and OpenStreetMap Nominatim geocoding.
* Algorithmic 3-factor dynamic pricing simulator with bounded guardrails.
* Real-time geospatial parking demand heatmap.
* Dual-mode payment gateway supporting both live Stripe Checkout Sessions and a zero-dependency local Sandbox Simulator with HMAC webhook reconciliation.
* Verified marketplace reviews requiring authenticated booking completion.
* Production-grade UI/UX redesign based on a bespoke, high-contrast design system.
* Continuous zero-cost serverless deployment on Vercel Hobby and MongoDB Atlas Free Tier.

---

## 2. Core Stakeholders & User Roles

| Role | Primary Objectives | Key Platform Capabilities |
| :--- | :--- | :--- |
| **Driver** | Discover, inspect, reserve, and pay for parking near a destination | Geospatial map discovery, address/landmark search with radius filtering, real-time availability checks, concurrency-safe reservations, Stripe and sandbox checkout, self-service cancellation, transaction ledger with receipts, verified review submissions. |
| **Host** | Monetize driveways, garages, or parking bays | Create and edit listings with interactive Leaflet pin-picker and reverse geocoding, toggle spot availability instantly, monitor aggregated earnings and reservation counts, review incoming driver reservations, protected against spot deletion while active bookings exist. |
| **Admin** | Maintain platform health, integrity, and safety | Audit listings and registered users, monitor system-wide transaction ledgers and booking lifecycles, oversee review authenticity and operational metrics. |

---

## 3. Platform Architecture Evolution

```
+-------------------------------------------------------------------------------+
| LEGACY POC BASELINE (Initial State)                                           |
| - Monolithic Express server tightly coupled to app.listen() (non-serverless)  |
| - Naive check-then-save booking logic vulnerable to double-booking races      |
| - Unsubstantiated "paid" status automatically assigned without transactions   |
| - Conflicting authentication: HTTP-only cookies set but bearer tokens passed  |
| - Rigid same-day booking calculations with mutable date objects               |
| - Development SSL private keys, certificates, and mkcert binaries in Git     |
| - Zero automated tests; failing ESLint rules; unhandled promise rejections    |
+-------------------------------------------------------------------------------+
                                      │
                                      ▼
+-------------------------------------------------------------------------------+
| PRODUCTION ARCHITECTURE (ParkingFinder 2.0 — Completed)                       |
| - Decoupled Express app running on Vercel Serverless Functions + Vite SPA CDN  |
| - Multi-document MongoDB transactional write locks ($inc: bookingSequence)   |
| - Strict half-open interval arithmetic: [StartTime, EndTime)                  |
| - Dual-mode billing: live Stripe Checkout Sessions + zero-config Sandbox       |
| - Cryptographic HMAC SHA-256 webhook reconciliation and immutable ledger      |
| - Unified HTTP-only JWT cookies (SameSite=Lax, Secure in production)          |
| - OpenStreetMap Nominatim geocoding with 450ms debouncing and compliant agent |
| - Algorithmic dynamic pricing engine and geospatial demand heatmap aggregation |
| - 34 automated unit and integration tests across 4 suites running on Vitest   |
| - Automated GitHub Actions CI/CD pipeline on Node 22 LTS with MongoDB replica |
| - Premium Urban Mobility UI/UX redesign with bespoke modular design system    |
+-------------------------------------------------------------------------------+
```

---

## 4. Technology Stack Overview

### Frontend Architecture
* **Framework:** React 19 bundled with Vite 7.
* **Routing:** React Router 7 managing client-side navigation and deep linking.
* **Styling & Design System:** Tailwind CSS 4 utility classes structured around custom semantic design tokens (`#17243A` text, `#2563EB` primary blue, `#F4F6F8` canvas, `#FFFFFF` surface, `#DDE3EA` border).
* **UI Components:** Bespoke modular primitives (`Button`, `Card`, `Badge`, `StatusBadge`, `PageHeader`, `Tabs`, `EmptyState`).
* **Animations:** Framer Motion for hardware-accelerated transitions and modal dialogs.
* **Geospatial Mapping:** Leaflet 1.9 and React-Leaflet with OpenStreetMap tiles.
* **Iconography:** Lucide React.
* **HTTP Client:** Axios configured with `withCredentials: true` for automatic cookie transmission.
* **Notifications:** React Hot Toast.

### Backend Architecture
* **Runtime:** Node.js 20+ / 22 LTS.
* **Web Framework:** Express.js decoupled into `backend/app.js` (middleware and routes) and `backend/server.js` (local HTTP runner).
* **Serverless Adapter:** `api/index.js` exporting serverless function handler for Vercel Functions.
* **Database & ODM:** MongoDB Atlas Free Tier (M0 Replica Set) with Mongoose 8.
* **Geospatial Engine:** GeoJSON `2dsphere` indexes with `$nearSphere` queries and dynamic server-side Haversine distance calculations.
* **Concurrency Control:** Atomic `$inc: { bookingSequence: 1 }` document write locks inside multi-document MongoDB transactions with exponential backoff retries.
* **Authentication:** JSON Web Tokens (JWT) stored in HTTP-only, `SameSite=Lax` cookies, with bcryptjs password hashing.
* **Security Middleware:** Helmet for HTTP headers, express-rate-limit for abuse prevention, and Zod for request schema validation.
* **Payment Engine:** Stripe Node SDK and custom Sandbox payment simulator with HMAC SHA-256 webhook signature verification.

### Testing & Tooling
* **Test Framework:** Vitest with Supertest executing 34 integration tests against a live MongoDB replica set across 4 test suites:
  * `test/booking.test.js` (10/10 passing)
  * `test/discovery.test.js` (10/10 passing)
  * `test/host.test.js` (5/5 passing)
  * `test/payment.test.js` (9/9 passing)
* **Linter:** ESLint configured with React recommended and hooks plugins (0 errors, 0 warnings).
* **CI/CD:** GitHub Actions workflow executing lint, test, and production Vite build on push/PR.
* **Deployment:** Vercel Edge CDN and Serverless Functions paired with MongoDB Atlas Free Tier ($0/month operational cost).

---

## 5. Repository Structure

```
ParkingFinder/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI/CD pipeline
├── api/
│   └── index.js                 # Vercel serverless function entrypoint
├── backend/
│   ├── controllers/
│   │   ├── auth.controller.js       # User registration, login, logout, profile
│   │   ├── bookings.controller.js   # Concurrency-safe reservation engine
│   │   ├── payments.controller.js   # Stripe checkout, webhook, and sandbox simulator
│   │   └── spots.controller.js      # Spot discovery, CRUD, heatmaps, and reviews
│   ├── middleware/
│   │   └── auth.middleware.js       # JWT cookie verification and role guards
│   ├── models/
│   │   ├── booking.model.js         # Booking schema with status enums and notes
│   │   ├── payment.model.js         # Immutable payment ledger schema
│   │   ├── spot.model.js            # Parking spot schema with 2dsphere index
│   │   └── user.model.js            # User schema with bcrypt hashing
│   ├── routes/
│   │   ├── auth.routes.js           # Auth route definitions
│   │   ├── bookings.routes.js       # Booking route definitions
│   │   ├── payments.routes.js       # Payment and webhook routes
│   │   └── spots.routes.js          # Spot discovery and management routes
│   ├── utils/
│   │   └── generateToken.js         # Secure HTTP-only cookie generator
│   ├── app.js                       # Decoupled Express application core
│   ├── db.js                        # Cached global Mongoose connection pooling
│   ├── server.js                    # Local development server runner
│   └── package.json                 # Backend dependencies
├── frontend/
│   ├── public/
│   │   ├── manifest.json            # PWA manifest
│   │   └── sw.js                    # PWA service worker offline shell
│   ├── src/
│   │   ├── assets/                  # Logos and static media
│   │   ├── components/
│   │   │   ├── auth/                # ProtectedRoute and RoleRoute guards
│   │   │   ├── booking/             # BookingModal reservation dialog
│   │   │   ├── common/              # Header, Footer, and layout elements
│   │   │   ├── host/                # CreateSpotForm and MySpotsList
│   │   │   └── ui/                  # Button, Card, Badge, PageHeader, Tabs, EmptyState
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Global authentication state
│   │   ├── pages/                   # Page components
│   │   │   ├── AboutPage.jsx            # About and platform story
│   │   │   ├── AddSpotPage.jsx          # Spot listing creation with pin-picker
│   │   │   ├── BookingSuccessPage.jsx   # Post-payment verification and confirmation
│   │   │   ├── CheckoutSimulatorPage.jsx# Local payment sandbox simulator
│   │   │   ├── ContactPage.jsx          # Support channels and mail client fallback
│   │   │   ├── DashboardPage.jsx        # Driver reservations and payment ledger
│   │   │   ├── EditSpotPage.jsx         # Spot modification and settings
│   │   │   ├── HomePage.jsx             # Marketing landing page with hero & presets
│   │   │   ├── HostDashboardPage.jsx    # Host operations, metrics, and incoming bookings
│   │   │   ├── LoginPage.jsx            # User sign-in
│   │   │   ├── MapPage.jsx              # Split-view geospatial discovery canvas
│   │   │   ├── PricingPage.jsx          # Tiers and dynamic pricing simulator
│   │   │   ├── ProfilePage.jsx          # User profile and account details
│   │   │   ├── RegisterPage.jsx         # User registration with role selection
│   │   │   └── SpotDetailsPage.jsx      # Two-column spot details and availability
│   │   ├── App.jsx                  # Main application router and layout shells
│   │   ├── index.css                # Tailwind CSS 4 theme and global styles
│   │   └── main.jsx                 # Client entrypoint
│   ├── index.html                   # HTML document template
│   ├── vite.config.js               # Vite compilation, proxy, and chunking config
│   └── package.json                 # Frontend dependencies
├── test/
│   ├── booking.test.js              # Concurrency and reservation lifecycle tests (10)
│   ├── discovery.test.js            # Geospatial, filter, and review tests (10)
│   ├── host.test.js                 # Host management and earnings tests (5)
│   ├── payment.test.js              # Stripe checkout, webhook, and sandbox tests (9)
│   └── setup.js                     # Global test environment and database lifecycle
├── docs/                            # Architectural documentation, ADRs, and guides
├── Readme.md                        # Production repository documentation
└── package.json                     # Monorepo root scripts and dev dependencies
```

---

## 6. Engineering Principles & Quality Standards

1. **Deterministic Concurrency:** Prevent race conditions at the database layer through atomic write locks and transactions, rather than relying on application-level locks.
2. **Transparent Billing:** Provide clear demarcation between production Stripe sessions and sandbox test-mode simulations; maintain an immutable audit trail for all monetary transactions.
3. **Zero Untracked Secrets:** Never track credentials, private keys, or certificates in version control. All configuration must be provided via sanitized environment variables.
4. **Resilient Serverless Operations:** Cache Mongoose connections globally to prevent pool exhaustion across serverless warm starts, and ensure routes fail gracefully with typed error responses.
5. **High-Contrast Usability:** Enforce WCAG AA contrast standards, semantic HTML landmarks, keyboard accessibility, and clean responsive behaviors across mobile, tablet, and desktop screens.
