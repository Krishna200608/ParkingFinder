# ParkingFinder — Initial Technical Audit (Stage 0)

## 1. Executive Summary
This document presents the complete technical baseline audit of the **ParkingFinder** repository. The inspection covers all frontend components, backend controllers, models, routes, dependencies, configuration files, and build pipelines.

While the foundational architecture (React + Vite + Tailwind + Express + Mongoose + Leaflet) provides a viable structure, the codebase exhibits several critical bugs, architectural inconsistencies, and security vulnerabilities that must be remediated prior to public deployment.

---

## 2. Inventory of Existing Modules & Execution Paths

### 2.1 Backend Modules
- **`server.js`:** Loads `.env`, calls `connectDB()`, attaches standard middleware (`cors()`, `json()`, `urlencoded()`, `cookieParser()`), defines root test route (`/`), mounts routes at `/api/auth`, `/api/spots`, `/api/bookings`, and listens on `PORT 5001`.
- **`db.js`:** Asynchronous MongoDB connection function using Mongoose. Lacks connection pooling/caching; calls `process.exit(1)` on connection error (a fatal behavior in serverless environments).
- **`controllers/auth.controller.js`:**
  - `registerUser`: Finds user by email, creates new user, sets cookie via `generateToken`, creates redundant token via `createToken`, returns `{ token, user }`. **Flaw:** Accepts arbitrary `role` from request body without validation.
  - `loginUser`: Compares bcrypt password hash, sets cookie, generates second token, returns `{ token, user }`.
  - `logoutUser`: Clears cookie without matching SameSite/Secure options.
  - `getUserProfile`: Returns `req.user`.
- **`controllers/bookings.controller.js`:**
  - `createBooking`: Validates existence of spotId and times. Checks for overlapping bookings via `findOne()`, calculates duration, automatically assigns `status: "confirmed"` and `paymentStatus: "paid"` (false payment confirmation), and saves booking.
  - `getMyBookings`: Populates spot and host for `req.user._id`.
  - `getBookingById`: Validates ownership (user, host, or admin).
  - `cancelBooking`: Sets `status: "cancelled"`. Lacks time-window restrictions.
  - `getBookedSlotsForSpot`: Queries upcoming bookings. Generates slots only for today. Mutates date objects in place.
- **`controllers/spots.controller.js`:**
  - `createParkingSpot`: Validates required fields using truthiness (which rejects price = 0 and coordinates = 0). Saves GeoJSON `Point`.
  - `getParkingSpots`: Queries spots using `$near` if `lat`/`lng` are provided.
  - `getParkingSpotById`: Populates owner and reviews.
  - `updateParkingSpot`: Updates spot fields; validates owner or admin role.
  - `deleteParkingSpot`: Deletes spot without checking for active/future bookings.
  - `createSpotReview`: Adds review to embedded array; recalculates average rating. Lacks verification that user completed a booking.
  - `getMyParkingSpots`: Aggregates bookings by spot to compute total earnings and booking counts. Contains out-of-order `import Booking` statement.

### 2.2 Frontend Modules
- **Routing Switch (`App.jsx`):**
  - Public routes: `/`, `/find`, `/login`, `/register`, `/profile`, `/about`, `/pricing`, `/contact`.
  - Protected driver routes: `/dashboard` (wrapped in `ProtectedRoute`).
  - Protected host routes: `/host/dashboard`, `/host/edit-spot/:id`, `/host/add-spot` (wrapped in `HostRoute`).
- **Authentication State (`AuthContext.jsx`):**
  - Stores `user` object in `localStorage.userInfo`.
  - Stores `token` in `localStorage.token`.
  - Sets `axios.defaults.headers.common["Authorization"] = Bearer <token>`.
  - **Inconsistency:** The backend `auth.middleware.js` reads ONLY `req.cookies.jwt` and never reads the Authorization header.
- **Pages & Components:**
  - `MapPage.jsx`: Renders Leaflet map with user location circle, radius slider, and spot markers. Filters spots by `s.owner?._id !== userInfo?.user?._id` (which fails because `userInfo` is the user object directly, not a wrapper).
  - `DashboardPage.jsx`: Displays user bookings. Displays prices in INR (`₹`). Lacks a button to cancel a booking.
  - `HostDashboardPage.jsx`: Displays host spots and earnings. Displays prices in USD (`$`).
  - `BookingModal.jsx`: Modal for reserving a spot. Enforces artificial same-day restriction (`startDate === endDate`). Calls `/api/bookings/spot/:spotId` which fails if unauthenticated due to route guard placement.
  - `AddSpotPage.jsx`: Full-featured map picker for creating spots. Directly hits Nominatim reverse geocoding without custom User-Agent.

---

## 3. Critical Bug List

| ID | Module / File | Line(s) | Description & Root Cause | Severity |
| :--- | :--- | :--- | :--- | :--- |
| **BUG-01** | `backend/controllers/bookings.controller.js` | 91–92 | **False Payment Confirmation:** Booking is initialized with `status: "confirmed"` and `paymentStatus: "paid"` without any payment transaction or payment gateway. | **Critical** |
| **BUG-02** | `backend/controllers/bookings.controller.js` | 54–95 | **Double-Booking Race Condition:** TOCTOU concurrency flaw. Overlap check `Booking.findOne()` followed by asynchronous `booking.save()` allows concurrent requests to double-book the same slot. | **Critical** |
| **BUG-03** | `backend/controllers/auth.controller.js` | 35 | **Privilege Escalation:** `registerUser` accepts arbitrary `role` from client payload without whitelisting, allowing anyone to register as an administrator. | **Critical** |
| **BUG-04** | `backend/middleware/auth.middleware.js` vs Frontend Context | 9 | **Authentication Protocol Mismatch:** Backend middleware inspects `req.cookies.jwt` exclusively. Frontend `AuthContext` puts token in `localStorage` and sets Authorization header. If cookies fail or credentials are omitted, requests fail with 401. | **High** |
| **BUG-05** | `frontend/src/pages/MapPage.jsx` | 67–74 | **Broken Auth Property Access:** `userInfo?.token` and `userInfo?.user?._id` are accessed, but `userInfo` stored in state is the user object itself. Both expressions evaluate to `undefined`. | **High** |
| **BUG-06** | `backend/routes/bookings.routes.js` | 14, 19 | **Accidentally Protected Public Route:** `router.use(protect)` is placed at the router level, blocking unauthenticated users from querying spot availability via `GET /api/bookings/spot/:spotId`. | **High** |
| **BUG-07** | `backend/controllers/spots.controller.js` | 25 | **Numeric Truthiness Bug:** Validation `!pricePerHour` rejects `0` (preventing free parking spots). Similarly, coordinates of `0` are rejected. | **Medium** |
| **BUG-08** | `backend/controllers/bookings.controller.js` | 213–216 | **In-Place Date Mutation:** `today.setHours(0,0,0,0)` and `today.setHours(23,59,59,999)` mutate the same date object, corrupting boundary calculations. | **Medium** |
| **BUG-09** | `frontend/src/components/booking/BookingModal.jsx` | 67–70 | **Arbitrary Same-Day Constraint:** `if (startDate !== endDate)` blocks valid multi-day or overnight reservations at the UI level. | **Medium** |
| **BUG-10** | `frontend/src/components/Header.jsx` | 158 | **Constant Condition Syntax Bug:** `{userInfo.role === "host" || "admin" ? ...}` evaluates to true unconditionally because `"admin"` is truthy. | **Medium** |
| **BUG-11** | `frontend/src/pages/EditSpotPage.jsx` | 140 | **Unused Function Arguments:** ESLint errors on unused `lat` and `lng` variables in `handleAddressUpdate`. | **Low** |
| **BUG-12** | `frontend/src/pages/DashboardPage.jsx` | Entire file | **Missing UI Action:** Backend exposes `/api/bookings/:id/cancel`, but the driver dashboard lacks a cancel action button. | **Medium** |
| **BUG-13** | Frontend Pages (`LoginPage`, `RegisterPage`, `HomePage`) | Various | **Vite Asset Path Fragility:** Hardcoded `src="/src/assets/..."` paths can fail in production builds when `/src` is not exposed statically. | **Medium** |
| **BUG-14** | `backend/controllers/spots.controller.js` | 163 | **Unsafe Spot Deletion:** Hard deletion of a spot does not check for active or future reservations, leaving orphaned bookings. | **Medium** |
| **BUG-15** | `backend/controllers/spots.controller.js` | 192 | **Unverified Reviews:** Users can post reviews on parking spots they have never booked. | **Medium** |

---

## 4. Runtime & Build Verification Logs

### 4.1 Frontend Linter (`npm run lint --prefix frontend`)
- **Execution Command:** `npm run lint --prefix frontend`
- **Result:** **FAILED (Exit Code 1)**
- **Output:**
  ```
  D:\Web D\ParkingFinder\frontend\src\components\Header.jsx
    158:24  error  Unexpected constant condition  no-constant-condition

  D:\Web D\ParkingFinder\frontend\src\context\AuthContext.jsx
    69:14  error  Fast refresh only works when a file only exports components  react-refresh/only-export-components

  D:\Web D\ParkingFinder\frontend\src\pages\AddSpotPage.jsx
    215:5  warning  React Hook useEffect has a missing dependency: 'coordinates'  react-hooks/exhaustive-deps

  D:\Web D\ParkingFinder\frontend\src\pages\EditSpotPage.jsx
    140:41  error  'lat' is defined but never used  no-unused-vars
    140:46  error  'lng' is defined but never used  no-unused-vars

  D:\Web D\ParkingFinder\frontend\src\pages\HomePage.jsx
    3:10  error  'motion' is defined but never used  no-unused-vars

  D:\Web D\ParkingFinder\frontend\src\pages\HostDashboardPage.jsx
    44:6  warning  React Hook useEffect has a missing dependency: 'fetchSpots'  react-hooks/exhaustive-deps

  D:\Web D\ParkingFinder\frontend\src\pages\MapPage.jsx
     27:24  error    'mapRef' is defined but never used  no-unused-vars
     56:5   warning  React Hook useEffect has a missing dependency: 'fetchSpots'  react-hooks/exhaustive-deps
    136:12  error    'err' is defined but never used  no-unused-vars

  D:\Web D\ParkingFinder\frontend\src\pages\ProfilePage.jsx
    33:6  warning  React Hook useEffect has a missing dependency: 'userInfo.token'  react-hooks/exhaustive-deps

  D:\Web D\ParkingFinder\frontend\vite.config.js
    12:41  error  '__dirname' is not defined  no-undef
    13:42  error  '__dirname' is not defined  no-undef

  ✖ 13 problems (9 errors, 4 warnings)
  ```

### 4.2 Frontend Production Build (`npm run build --prefix frontend`)
- **Execution Command:** `npm run build --prefix frontend`
- **Result:** **SUCCESS (Exit Code 0)**
- **Output:**
  ```
  vite v7.1.12 building for production...
  transforming...
  ✓ 2201 modules transformed.
  rendering chunks...
  computing gzip size...
  dist/index.html                   0.66 kB │ gzip:   0.44 kB
  dist/assets/index-CRPoh6pr.css   50.14 kB │ gzip:  13.07 kB
  dist/assets/index-DpQ3oLVz.js   636.40 kB │ gzip: 197.94 kB
  (!) Some chunks are larger than 500 kB after minification.
  ✓ built in 6.64s
  ```

### 4.3 Backend Syntax Validation (`node --check`)
- **Execution Command:** Tested all `.js` files recursively in `backend/`.
- **Result:** **SUCCESS** — All files parsed cleanly without syntax errors.

### 4.4 Local Server Boot & HTTP Verification
- **Execution Command:** `npm run server`
- **Result:** **SUCCESS** — Server initialized on `http://localhost:5001` and connected to local MongoDB instance (`127.0.0.1`). Verified with `curl http://localhost:5001/` returning `"Parking Finder API is running..."`.
- **Note:** Executing `node backend/server.js` directly from repository root failed due to `dotenv.config()` seeking `.env` in the current working directory rather than relative to `backend/`.

