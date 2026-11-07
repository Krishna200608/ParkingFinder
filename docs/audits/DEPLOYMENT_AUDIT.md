# ParkingFinder — Deployment Feasibility Audit (Stage 0)

## 1. Executive Summary
This audit evaluates the feasibility of deploying **ParkingFinder** entirely on zero-cost infrastructure: **Vercel Hobby Plan** for both the React/Vite frontend and Express serverless backend, connected to **MongoDB Atlas Free Tier (M0 Sandbox)** for persistent storage.

---

## 2. Infrastructure Layer Analysis

### 2.1 Vercel Hobby Plan Compatibility
Vercel's Hobby tier is designed for personal and portfolio projects, providing global CDN distribution for static assets and serverless Node.js execution for backend APIs.

| Feature / Limit | Vercel Hobby Specification | ParkingFinder Architecture Fit |
| :--- | :--- | :--- |
| **Cost** | ₹0 / month | Complies |
| **Max Function Duration** | Up to 300 seconds (Fluid Compute) | Typical API response time: 50–200 ms |
| **Memory Limit** | Up to 2,048 MB | Express API bundle footprint: < 50 MB |
| **Payload Size** | 4.5 MB request / response limit | Payloads are lightweight JSON: < 50 KB |
| **Filesystem** | Ephemeral, read-only except `/tmp` | Requires stateless backend (no local disk file uploads) |
| **Process Model** | Request-driven serverless invocation | Requires removing continuous `app.listen()` |

### 2.2 MongoDB Atlas Free Tier (M0 Sandbox) Compatibility
MongoDB Atlas provides a persistent cloud-hosted database suitable for the application's data volume.

| Attribute | Atlas M0 Free Limit | Application Requirement |
| :--- | :--- | :--- |
| **Storage Capacity** | 512 MB | Anticipated dataset size: < 20 MB |
| **Max Connections** | 500 concurrent connections | Managed via cached Mongoose connection pool ($\le 10$ per instance) |
| **Geospatial Support** | Full GeoJSON & `2dsphere` indexes | Essential for `$near` proximity queries |
| **Transactions** | Full replica set multi-document ACID | Supported on all Atlas M0 clusters |

---

## 3. Deployment Blockers & Architectural Incompatibilities

### 3.1 Blocker 1: Continuous Process Listener (`app.listen()`)
- **Current Behavior:** `backend/server.js` invokes `app.listen(PORT)` directly upon module import. In a serverless environment like Vercel Functions, calling `app.listen()` prevents the function from terminating cleanly and results in function timeouts or gateway errors.
- **Required Architecture Change:**
  - Create `backend/app.js` which configures all Express routes and middleware and exports `app` without listening.
  - Create `backend/server.js` as the local development runner (`app.listen(PORT)`).
  - Create `api/index.js` at repository root as the Vercel serverless request handler.

### 3.2 Blocker 2: Uncached MongoDB Connections & `process.exit(1)`
- **Current Behavior:** `backend/db.js` attempts a new `mongoose.connect()` on execution and calls `process.exit(1)` if connection fails. In a serverless environment:
  1. Rapid consecutive invocations establish duplicate connection pools, rapidly exhausting the 500-connection Atlas ceiling.
  2. Calling `process.exit(1)` kills the serverless container abruptly, preventing proper HTTP error responses.
- **Required Architecture Change:**
  - Implement the cached connection pattern (`global.mongoose = { conn, promise }`).
  - Replace `process.exit(1)` with thrown exceptions that return controlled HTTP 500/503 errors.

### 3.3 Blocker 3: Missing SPA Deep-Link Rewrites
- **Current Behavior:** The frontend relies on React Router for client-side navigation (`/find`, `/dashboard`, `/host/dashboard`). Without server configuration, refreshing any subroute on Vercel returns a `404 Not Found`.
- **Required Architecture Change:**
  - Introduce `vercel.json` with rewrite rules directing all non-API paths to `frontend/dist/index.html`.

### 3.4 Blocker 4: Hardcoded Localhost Target in Vite Proxy
- **Current Behavior:** `frontend/vite.config.js` hardcodes `proxy: { '/api': { target: 'http://localhost:5001' } }`. In production, if API requests use relative paths (`/api/...`), they must map seamlessly to the serverless function handler.
- **Required Architecture Change:**
  - Maintain relative paths (`/api/...`) on the frontend.
  - In production, Vercel routes `/api/*` to the serverless function on the same origin, completely bypassing cross-origin CORS complications.

---

## 4. Proposed Monorepo Vercel Topology

```
ParkingFinder/
├── api/
│   └── index.js             # Serverless handler (imports backend/app.js)
├── backend/
│   ├── app.js               # Express application module (export default app)
│   ├── server.js            # Local dev runner (app.listen(PORT))
│   ├── db.js                # Cached Mongoose connection module
│   └── ...
├── frontend/
│   ├── src/
│   ├── vite.config.js
│   └── package.json
├── vercel.json              # Route rewrites (API vs SPA)
└── package.json             # Root scripts
```

---

## 5. Deployment Readiness Verdict
The application is **100% compatible with free-tier Vercel and MongoDB Atlas** once the serverless Express adaptation, connection caching, and `vercel.json` rewrites are completed in Stage 2.

