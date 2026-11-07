# ParkingFinder 2.0 — Deployment Guide

## 1. Architecture Overview
ParkingFinder is designed for zero-cost deployment using:
1. **Frontend:** React/Vite SPA hosted on Vercel's Global Edge CDN.
2. **Backend:** Express API deployed as a Vercel Serverless Function running on Node.js.
3. **Database:** Persistent MongoDB Atlas Free M0 replica set cluster (512 MB).

```
                      +-----------------------------+
                      |         Vercel CDN          |
                      |  (Static Assets / SPA HTML) |
                      +--------------+--------------+
                                     |
              +----------------------+----------------------+
              |                                             |
              ▼                                             ▼
       /* (SPA Routes)                             /api/* (API Routes)
     Rewritten to index.html                     Serverless Express Handler
              |                                     (api/index.js)
              ▼                                             |
       React 19 App                                         ▼
                                                    MongoDB Atlas M0
                                                    (Persistent Cluster)
```

---

## 2. Serverless Express Adaptation

In traditional hosting, Express runs an infinite event loop using `app.listen(PORT)`. In Vercel serverless execution, requests are dispatched to an exported request handler function:

```javascript
// api/index.js (Production Serverless Entrypoint)
import app from '../backend/app.js';
import connectDB from '../backend/db.js';

export default async function handler(req, res) {
  await connectDB();
  return app(req, res);
}
```

### 2.1 Mongoose Connection Caching Pattern
To avoid exhausting MongoDB Atlas connection pools across serverless function invocations, Mongoose connections must be cached globally:

```javascript
// backend/db.js
import mongoose from 'mongoose';

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
    };
    cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};

export default connectDB;
```

---

## 3. Vercel Project Configuration (`vercel.json`)

The root `vercel.json` coordinates client-side routing and serverless function routing:

```json
{
  "version": 2,
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.js"
    },
    {
      "source": "/(.*)",
      "destination": "/frontend/dist/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/frontend/dist/index.html"
    }
  ]
}
```

---

## 4. Environment Variables Checklist

Set these environment variables in the Vercel Project Settings under **Settings > Environment Variables**:

| Variable Name | Environment | Description | Example / Format |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Production, Preview | Execution environment | `production` |
| `MONGO_URI` | Production, Preview | MongoDB Atlas connection string | `mongodb+srv://<user>:<password>@cluster0.mongodb.net/parkingfinder?retryWrites=true&w=majority` |
| `JWT_SECRET` | Production, Preview | Cryptographically random secret | Minimum 32-character high-entropy string |
| `PORT` | Local Development | Local listening port | `5001` |

> [!WARNING]
> Never commit actual credentials or production `.env` files to Git. Ensure `.env` is listed in all `.gitignore` files.

---

## 5. Step-by-Step Deployment Procedure

### Step 5.1: Prepare MongoDB Atlas Free Cluster
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Create a free **M0 Sandbox Cluster** in your preferred cloud provider and region.
3. Under **Database Access**, create a database user with `readWriteAnyDatabase` privileges.
4. Under **Network Access**, add IP Access `0.0.0.0/0` (Allow Access from Anywhere) to permit connections from dynamic Vercel serverless IPs.
5. In the cluster overview, click **Connect > Drivers > Node.js** and copy the connection string. Replace `<username>` and `<password>` with your database user credentials.

### Step 5.2: Configure Vercel Project
1. Log in to [Vercel](https://vercel.com/) and click **Add New > Project**.
2. Import the `Krishna200608/ParkingFinder` GitHub repository.
3. Configure the Project Settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `./`
   - **Build Command:** `npm run build --prefix frontend`
   - **Output Directory:** `frontend/dist`
   - **Install Command:** `npm install`
4. Add the required Environment Variables (`MONGO_URI`, `JWT_SECRET`, `NODE_ENV`).
5. Click **Deploy**.

---

## 6. Post-Deployment Smoke Test Runbook

Perform this sequential verification immediately after deployment:

1. **Static App Loading:** Navigate to the live Vercel URL. Verify the hero section, illustrations, and navigation bar render correctly.
2. **Deep-Link SPA Refresh:** Navigate directly to `/find` and refresh the browser. Confirm that the map loads without a 404 error.
3. **API Health Check:** Visit `https://<your-vercel-domain>/api/health`. Verify that JSON `{ status: "ok", db: "connected" }` is returned.
4. **User Registration:** Register a new driver account. Verify that a user profile is created and you are redirected to login.
5. **Driver Login & Session:** Log in with the registered credentials. Inspect DevTools cookies to confirm the secure HTTP-only `jwt` cookie is set.
6. **Geospatial Discovery:** Open `/find`. Verify that parking spot markers appear on the map and that zooming or centering functions smoothly.
7. **Reservation Creation:** Click a parking spot, select an available future time interval, and submit a reservation. Verify that the booking confirmation displays cleanly.
8. **Dashboard Verification:** Open `/dashboard`. Confirm the new reservation appears in the booking list with status `confirmed` and `unpaid_demo`.
9. **Cancellation Flow:** Click **Cancel Booking**. Verify that the status updates to `cancelled` and the time slot becomes available again.
10. **Host Workflow:** Register a new host account, visit `/host/dashboard`, click **Add Spot**, submit new spot coordinates, and verify the listing appears in search.

