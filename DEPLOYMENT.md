# Deploy Plantopia to Vercel

The frontend and API are separate Vercel projects connected to the same GitHub repository. MongoDB Atlas remains the persistent database; Vercel does not provide a MongoDB database.

## 1. Push the code to GitHub

Push this branch and merge it into the branch you plan to deploy, or select this branch when importing the repository into Vercel. Vercel can only deploy code that has been pushed to GitHub or explicitly deployed with its CLI.

## 2. Create the backend Vercel project

1. Sign in at [vercel.com](https://vercel.com) and choose **Add New → Project**.
2. Import `Rukshan19-mr-png/E-commerce-website`.
3. Set **Root Directory** to `backend`.
4. Use the **Other** framework preset. Keep the API entry point at `api/index.js`; the existing `backend/vercel.json` routes requests to it.
5. In **Settings → Environment Variables**, add the backend variables listed below. Choose **Production**, and add **Preview** too if you want to test preview deployments.
6. Deploy the project. Copy its production domain, for example `https://plantopia-api.vercel.app`.

Backend environment variables:

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Long, random secret for signing login tokens |
| `ALLOWED_ORIGINS` | Exact frontend origin, e.g. `https://plantopia.vercel.app` (no trailing slash) |
| `FRONTEND_URL` | Frontend production URL; used for PayPal return/cancel links |
| `BACKEND_URL` | Backend production URL; used in the API content security policy |
| `PAYPAL_MODE` | `sandbox` for testing or `live` for real payments |
| `PAYPAL_CLIENT_ID` | PayPal app client ID |
| `PAYPAL_CLIENT_SECRET` | PayPal app secret |
| `EMAIL_USER` | Gmail account used to send notification emails; required for password resets |
| `EMAIL_PASS` | Gmail App Password (not the normal account password); required with `EMAIL_USER` |
| `TWILIO_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Twilio sender number in international format |

Set only variables for integrations you have configured. For real customer accounts and orders, configure MongoDB Atlas before launch; Vercel serverless memory is temporary and must not be used as the production database.

In MongoDB Atlas, create a database user, allow network access from Vercel (Atlas's `0.0.0.0/0` is the common serverless option; use strong database credentials), and copy the application's database connection string into `MONGO_URI`. Keep all secrets in Vercel environment variables, never in Git.

## 3. Create the frontend Vercel project

1. In Vercel, choose **Add New → Project** and import the same GitHub repository again as a second project.
2. Set **Root Directory** to `frontend`.
3. Select **Vite** (or let Vercel detect it). The build command is `npm run build`; the output directory is `dist`.
4. Add this environment variable for Production (and Preview if needed):

   | Variable | Value |
   |---|---|
   | `VITE_API_URL` | The backend production URL from step 2, e.g. `https://plantopia-api.vercel.app` |

5. Deploy the frontend and copy its production domain.

`VITE_API_URL` is embedded during the frontend build. If you change it later, redeploy the frontend.

## 4. Connect the production domains

After both projects have domains, go to the backend project's environment variables and set:

- `ALLOWED_ORIGINS` to the exact frontend production origin (include `https://`; do not add a trailing slash).
- `FRONTEND_URL` to the same frontend origin.
- `BACKEND_URL` to the backend production origin.

Redeploy the backend after changing environment variables. If you add a custom domain, update all three values as appropriate and redeploy. Preview domains are intentionally not allowed by default; add a specific preview origin to `ALLOWED_ORIGINS` when you need one.

## 5. Configure and validate integrations

- **PayPal:** start with sandbox credentials and `PAYPAL_MODE=sandbox`. Test a complete checkout before switching to live credentials and `PAYPAL_MODE=live`. Never expose `PAYPAL_CLIENT_SECRET` to the frontend.
- **Email:** set both `EMAIL_USER` and a Gmail App Password in Vercel. Production password-reset requests return an error unless real email credentials are configured; the local Ethereal test-mail fallback is not used for production password resets.
- **SMS:** configure an active Twilio account and verified sender number. Without credentials, SMS is only logged as a mock.
- **MongoDB:** confirm the backend's `/api/debug/db` endpoint reports `{"connected":true}` after deployment.

Finally test the frontend domain in a browser: product browsing/search, account signup/login, cart and stock checks, checkout, order history, password reset, and staff-only pages. Verify PayPal in sandbox and check Vercel function logs if an API request fails.

## Local checks before deployment

Run from the repository root:

```bash
npm test
npm --prefix frontend run lint
npm --prefix frontend run build
```

## Can this deployment be completed from this workspace?

The repository contains Vercel configurations for both projects, but creating projects and setting environment variables requires access to your Vercel, GitHub, MongoDB, PayPal, email, and Twilio accounts. Do not send passwords or secret keys in chat. Once the branch is pushed and the two Vercel projects are connected to GitHub with their environment variables, Vercel can deploy them automatically.
