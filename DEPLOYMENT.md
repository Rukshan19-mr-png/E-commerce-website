# Plantopia deployment plan (Vercel)

This repository is configured as two Vercel projects: a static Vite frontend in `frontend/` and an Express serverless API in `backend/`. Deploy them as separate projects from the same Git repository.

## 1. Prepare the external services

Before deploying, collect these values:

- A MongoDB Atlas database and its connection string. In Atlas, create a database user and allow connections from Vercel. For a production database, prefer the documented Vercel egress/IP approach available for your plan rather than leaving the cluster open to `0.0.0.0/0`.
- A long random `JWT_SECRET`.
- A PayPal Developer REST app. Start with its sandbox client ID and secret.
- Optional: Gmail app password and Twilio credentials if you want email and SMS notifications.

Do not commit `.env` files or put `PAYPAL_CLIENT_SECRET`, `MONGO_URI`, `JWT_SECRET`, or Twilio secrets in frontend variables. Vite variables prefixed with `VITE_` are included in public browser code.

## 2. Deploy the backend project

1. In Vercel, add a project and import this repository.
2. Set the **Root Directory** to `backend`. Keep the repository's `backend/vercel.json` configuration.
3. Use the Node.js runtime supported by the project. There is no frontend build step for this project.
4. Add these environment variables to Vercel for **Production**, and to Preview/Development only if you intend to use those environments:

   | Variable | Value |
   | --- | --- |
   | `MONGO_URI` | Atlas connection URI for the production database |
   | `JWT_SECRET` | Unique, long random secret |
   | `ALLOWED_ORIGINS` | Frontend origins, comma separated, no trailing slash (e.g. `https://plantopia.example,https://www.plantopia.example`) |
   | `BACKEND_URL` | Backend's public HTTPS origin |
   | `FRONTEND_URL` | Frontend's public HTTPS origin used by PayPal return/cancel links |
   | `PAYPAL_CLIENT_ID` | PayPal REST app client ID for this environment |
   | `PAYPAL_CLIENT_SECRET` | Matching PayPal REST app secret |
   | `PAYPAL_MODE` | `sandbox` during testing; `live` only after live credentials are installed |
   | `LKR_TO_USD_RATE` | The LKR-to-USD rate you intend to charge; update deliberately |
   | `PORT` | Not required on Vercel; used for local/server hosting |

   Add `EMAIL_USER`, `EMAIL_PASS`, `TWILIO_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER` only if enabling those notification services.

5. Deploy and copy the resulting backend URL (for example `https://plantopia-api-....vercel.app`). Confirm `GET https://<backend-host>/api` and `GET https://<backend-host>/api/config/paypal` return JSON directly without redirecting to Vercel login; the PayPal config may expose only the public client ID, never the secret. If requests redirect to `/login` or `/sso-api`, disable Vercel Deployment Protection for the backend production deployment or use an API domain that is publicly reachable. Never put a Vercel protection-bypass secret in frontend code.

PayPal checkout is disabled on Vercel unless the backend can reach MongoDB; serverless in-memory orders cannot safely be used to record paid purchases. Checkout reserves verified stock while the buyer completes PayPal. The reservation is released when PayPal is cancelled, or when the pending checkout has expired for 30 minutes and the next checkout/configuration request performs cleanup.

## 3. Deploy the frontend project

1. Add a second Vercel project from the same repository.
2. Set **Root Directory** to `frontend`.
3. Use these settings (Vercel normally detects Vite automatically):
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`
4. Set `VITE_API_URL` to the backend origin from step 2, with no `/api` suffix, for example `https://plantopia-api-....vercel.app`.
5. Deploy. `VITE_API_URL` is embedded at build time, so redeploy the frontend after changing it.
6. In the backend's `ALLOWED_ORIGINS`, list the exact frontend production domains. Include both apex and `www` origins if both are used. Redeploy the backend after changing its environment variables.

Vercel preview domains are currently allowed by the backend CORS rule for `*.vercel.app`. Keep production origins in `ALLOWED_ORIGINS` exact. The `FRONTEND_URL` should be the stable production frontend origin, not a short-lived preview URL.

## 4. Connect a custom domain (optional)

Add the custom domain in the frontend Vercel project and complete the DNS records Vercel provides. Choose one canonical origin (with or without `www`) and redirect the other to it. Update backend `ALLOWED_ORIGINS` with each origin that should make API requests, update `FRONTEND_URL` to the canonical origin, and redeploy the backend. HTTPS should be active before enabling live checkout.

## 5. Sandbox checkout verification

Keep `PAYPAL_MODE=sandbox` and sandbox app credentials on the backend. Create a sandbox business account for the merchant and a separate sandbox personal account as the buyer in PayPal Developer Dashboard. Then verify:

1. Frontend loads and product data comes from the deployed API.
2. Signup/login works and orders appear in the user's order history.
3. Cash on delivery creates an unpaid order.
4. PayPal checkout shows the sandbox merchant, charges the expected USD amount from the LKR total and configured rate, and marks the matching order paid after successful capture.
5. Cancelling or declining PayPal does not mark an order paid.
6. Changing a product price or submitting an invalid quantity cannot change the server-calculated PayPal charge.

The PayPal REST secret stays on the backend. The browser obtains only the public client ID from `/api/config/paypal`.

## 6. Go live

After successful sandbox testing, switch the backend to the live PayPal REST app credentials and set `PAYPAL_MODE=live`. Confirm the live `FRONTEND_URL`, `ALLOWED_ORIGINS`, `BACKEND_URL`, and `LKR_TO_USD_RATE`, then redeploy the backend. Vercel environment changes require a new deployment. Make one controlled low-value live purchase and verify the PayPal activity and matching paid order before announcing checkout availability.

## 7. Rollback and operations

- If checkout misbehaves, set `PAYPAL_MODE=sandbox` with sandbox credentials or temporarily remove the PayPal credentials to disable PayPal checkout, then redeploy the backend. Do not mix live and sandbox IDs/secrets.
- Redeploy the last known-good Vercel deployment if the frontend or API release causes an outage.
- Monitor Vercel function logs and MongoDB Atlas connectivity after release. Static in-memory fallback data is not persistent and must not be considered a production database fallback.
- Keep credentials in Vercel environment settings, rotate them if exposed, and update/redeploy the affected project.

## Current repository configuration

- Backend Vercel entry point: `backend/api/index.js`; catch-all routing is in `backend/vercel.json`.
- Frontend build: Vite; SPA routing fallback is in `frontend/vercel.json`.
- Local frontend development proxies `/api` to `http://localhost:5000`.
- Production frontend requires `VITE_API_URL`; there is no hardcoded API host fallback.
