# ParkingFinder 2.0 — Architecture Decision Records (ADRs)

## ADR 001: Unified Vercel Hobby Serverless Monorepo Deployment
- **Status:** Accepted
- **Context:** The application consists of a React/Vite frontend and an Express backend. Traditional continuous hosting (e.g., Render, Railway) either charges after trial periods or spins down containers after 15 minutes of inactivity, producing jarring 50-second cold starts during interviews or resume evaluations.
- **Decision:** Deploy both the frontend SPA and Express REST API on Vercel's Hobby tier. Decouple Express from `app.listen()` and export it as a serverless handler (`/api/index.js`). Direct all API traffic through `/api/*` and route SPA assets through Vercel's global CDN.
- **Consequences:**
  - Zero ongoing hosting costs.
  - No container spin-down or 15-minute sleep states.
  - Backend must be strictly stateless (no local disk writes, no long-lived in-memory state).
  - Serverless function invocations are subject to Hobby plan execution limits (Fluid Compute defaults up to 300s, 2 GB memory).

---

## ADR 002: Persistent Database on MongoDB Atlas Free M0 Cluster
- **Status:** Accepted
- **Context:** The application relies on GeoJSON `2dsphere` indexes for proximity queries (`$near`, `$geoNear`) and requires persistent storage for users, spots, and reservations.
- **Decision:** Utilize MongoDB Atlas Free Tier (M0 Replica Set, 512 MB storage). Manage connection lifecycle using Mongoose connection caching to prevent connection exhaustion during serverless function scaling.
- **Consequences:**
  - Storage is capped at 512 MB (more than sufficient for hundreds of spots, users, and reservations).
  - Connection pooling must be cached globally (`global.mongooseConn`) rather than opened per request.
  - Replica set support enables multi-document ACID transactions for atomic reservation checks.

---

## ADR 003: Single Unified Authentication Strategy via HTTP-Only JWT Cookies
- **Status:** Accepted
- **Context:** The legacy codebase maintained split authentication state: `generateToken` issued an HTTP-only cookie, `auth.controller` also generated a separate token sent in JSON, and `AuthContext` placed that token into `localStorage` and set `axios.defaults.headers.common["Authorization"]`. Meanwhile, `auth.middleware.js` checked exclusively `req.cookies.jwt`, while some frontend pages attempted to pass `Authorization: Bearer undefined`.
- **Decision:** Standardize on secure HTTP-only cookies as the single source of truth for browser authentication. Remove `localStorage` token storage. Configure cookies with `httpOnly: true`, `sameSite: "lax"`, and `secure: process.env.NODE_ENV === "production"`. Ensure Axios sends cookies automatically with `withCredentials: true`.
- **Consequences:**
  - High immunity to XSS-based token theft (tokens cannot be read by JavaScript).
  - Eliminates conflicting auth state between `localStorage` and browser cookies.
  - Requires clean handling of CORS credentials if API and client are accessed cross-domain, though same-origin routing on Vercel minimizes cross-domain complexity.

---

## ADR 004: Transparent Demo Reservation Lifecycle vs. Fake Payment Gateway
- **Status:** Accepted
- **Context:** The legacy codebase marked newly created reservations as `status: "confirmed"` and `paymentStatus: "paid"` despite having no payment integration. This creates false payment claims and poor engineering transparency.
- **Decision:** Replace the fake payment status with an honest demo reservation lifecycle:
  - Allowed `paymentStatus`: `"not_required"` or `"unpaid_demo"`.
  - Allowed `status`: `"pending"`, `"confirmed"`, `"active"`, `"completed"`, `"cancelled"`.
  - Provide clear UI badging indicating that reservations are portfolio demonstrations. Maintain clean abstraction boundaries so a real gateway (e.g. Stripe, Razorpay) can be introduced seamlessly.
- **Consequences:**
  - Professional integrity in technical portfolio reviews.
  - Eliminates confusion for users and evaluators.
  - Clean separation between reservation validation and transaction settlement.

---

## ADR 005: Concurrency Safety via Half-Open Intervals & Transactional Overlap Checks
- **Status:** Accepted
- **Context:** The legacy `createBooking` performs a non-atomic `findOne` for overlapping bookings followed by `booking.save()`. Concurrent requests for the same spot can both pass the check simultaneously, causing double bookings.
- **Decision:**
  - Adopt half-open interval semantics: $[StartTime, EndTime)$, allowing contiguous bookings where one ends at the exact minute another begins.
  - Implement MongoDB transaction-backed or atomic locking reservation logic to guarantee that overlapping requests cannot execute concurrently on the same parking spot document.
- **Consequences:**
  - Solves the Time-of-Check to Time-of-Use (TOCTOU) race condition.
  - Rejects competing reservations with HTTP `409 Conflict`.
  - Demonstrates enterprise-grade transactional concurrency control.

---

## ADR 006: Leaflet & OpenStreetMap Integration with Nominatim Rate Limiting
- **Status:** Accepted
- **Context:** Maps and geocoding are essential for parking discovery. Commercial mapping APIs (Google Maps, Mapbox) require credit cards and can incur unexpected charges.
- **Decision:** Retain React Leaflet with OpenStreetMap map tiles. For address search and reverse geocoding, use OpenStreetMap's Nominatim service strictly adhering to its Usage Policy: include a custom `User-Agent` header, throttle requests to $\le 1$ req/sec, and implement client-side caching.
- **Consequences:**
  - Zero financial overhead.
  - Respectful utilization of public open-source geocoding infrastructure.
  - Prevents IP banning and 403 Forbidden errors from Nominatim.

---

## ADR 007: Image Handling Strategy for Serverless Environments
- **Status:** Accepted
- **Context:** Vercel serverless functions have ephemeral, read-only filesystems (aside from temporary `/tmp`). Local file uploads (`multer` writing to `backend/uploads/`) do not persist and cause runtime failures in production.
- **Decision:** For the free-tier baseline, do not write uploads to local disk. Utilize high-quality curated sample images for demo listings, and provide a validated URL field for custom listing photos. A cloud storage provider (e.g. Cloudinary free tier) can be layered as an optional enhancement.
- **Consequences:**
  - Prevents serverless filesystem crashes.
  - Zero storage billing risk.
  - Guarantees fast, reliable image rendering across all environments.

