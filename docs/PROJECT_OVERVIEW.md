# ParkingFinder 2.0 — Project Overview

## 1. Executive Summary
**ParkingFinder** is a full-stack, two-sided parking marketplace designed to connect drivers seeking urban parking spaces with space owners (hosts and facility operators) listing available spots. The project aims to eliminate parking friction, minimize vehicle emissions caused by circling for spots, and provide property owners with monetizable asset utilization.

This revival transforms an existing proof-of-concept into a production-grade, resume-worthy platform that demonstrates advanced full-stack engineering: geospatial queries, concurrent reservation safety, role-based authorization, serverless execution on Vercel, and modern responsive UI design.

---

## 2. Core Stakeholders & User Roles

| Role | Primary Objectives | Key Platform Capabilities |
| :--- | :--- | :--- |
| **Driver** | Discover, inspect, and reserve parking near a destination | Interactive geospatial map discovery, search by locality/radius, date & time availability checks, reservation booking, reservation tracking, booking cancellation. |
| **Host** | Monetize driveway, garage, or lot spaces | List parking spots with location pinning, manage spot details and pricing, review incoming bookings, track reservation history, monitor earnings and utilization metrics. |
| **Admin** | Maintain platform health, integrity, and safety | Review registered users and listings, audit transactions, oversee moderation, manage platform-wide metrics. |

---

## 3. Current State vs. Target State (ParkingFinder 2.0)

```
+-------------------------------------------------------------------------------+
| CURRENT POC BASELINE                                                          |
| - Express server tied to app.listen() (non-serverless)                        |
| - Check-then-save booking logic vulnerable to race conditions                 |
| - Fake "paid" status automatically assigned without payment processing        |
| - Split authentication: cookies set but frontend passes missing Bearer token  |
| - Same-day only booking restrictions; rigid date calculations                 |
| - Dev HTTPS certificates, private key, and mkcert binary tracked in git      |
| - No automated unit or integration tests; ESLint failures on linting          |
+-------------------------------------------------------------------------------+
                                      │
                                      ▼
+-------------------------------------------------------------------------------+
| TARGET REVIVED ARCHITECTURE (ParkingFinder 2.0)                               |
| - Serverless Express API running on Vercel Functions + Vite SPA on Vercel CDN |
| - Transactional / versioned double-booking prevention with strict intervals   |
| - Honest demo reservation lifecycle (not_required / unpaid_demo)              |
| - Unified HTTP-only JWT cookie authentication with strict CSRF & SameSite     |
| - Flexible multi-day and hourly scheduling with dynamic availability slots    |
| - Clean repository hygiene, sanitized configs, zero exposed secrets           |
| - Vitest + Supertest automated testing pipeline with GitHub Actions CI/CD     |
| - Differentiators: Demand heatmaps, dynamic pricing simulator, EV filters     |
+-------------------------------------------------------------------------------+
```

---

## 4. Technology Stack Overview

- **Frontend:** React 19, Vite 7, React Router 7, Tailwind CSS 4, React Leaflet (OpenStreetMap), Framer Motion, Lucide React, Axios, React Hot Toast.
- **Backend:** Node.js, Express.js 5, Mongoose 8, MongoDB Atlas (GeoJSON `2dsphere` indexes), JSON Web Tokens (JWT), bcryptjs, Cookie-Parser.
- **Quality & Security:** Zod validation, Helmet security headers, Express-Rate-Limit, Vitest, Supertest.
- **Target Infrastructure:** Vercel Hobby (Zero-cost serverless frontend & backend), MongoDB Atlas Free M0 cluster (512 MB storage).

---

## 5. Repository Structure

```
ParkingFinder/
├── backend/                  # Express REST API
│   ├── controllers/          # Business logic handlers (auth, bookings, spots)
│   ├── middleware/           # Auth guard and role verification
│   ├── models/               # Mongoose schemas (User, ParkingSpot, Booking)
│   ├── routes/               # Express routing definitions
│   ├── utils/                # JWT cookie token generator
│   ├── db.js                 # Database connection logic
│   ├── server.js             # Express application & server listener
│   └── package.json          # Backend dependencies
├── frontend/                 # Vite + React single page application
│   ├── src/
│   │   ├── assets/           # Static logos and graphic resources
│   │   ├── components/       # Reusable UI elements (Header, Footer, BookingModal, etc.)
│   │   ├── context/          # React AuthContext
│   │   ├── pages/            # Page components (Home, Map, Dashboards, Spot CRUD)
│   │   ├── App.jsx           # Main routing switch
│   │   └── main.jsx          # DOM entry point
│   ├── index.html            # HTML shell
│   ├── vite.config.js        # Vite build & proxy configuration
│   └── package.json          # Frontend dependencies
├── docs/                     # Architectural documentation, ADRs, audits, and roadmaps
├── screenshots/              # UI screenshots and video demonstrations
├── package.json              # Monorepo root runner
└── Readme.md                 # Project README
```

---

## 6. Engineering Conventions & Git Strategy

1. **Non-Destructive Evolution:** Preserve existing functional assets; do not tear down working features without justification.
2. **Branching Model:** Feature branch workflow (`feature/<milestone-name>`) merged into `main` only after linting, testing, and verified builds pass.
3. **No Unsanctioned Secrets:** Zero secret credentials, private keys, or certificates committed to Git.
4. **Separation of Concerns:** Business logic strictly in controllers/services; schemas strictly in models; routing declarations clean and declarative.

