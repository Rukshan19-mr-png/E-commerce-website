# Plantopia Deployment Guide

This document explains how to prepare the app for production hosting and domain setup.

## 1. Required environment files

### Backend
- Copy `backend/.env.example` to `backend/.env`
- Fill in secure values for all variables before deploying.

### Frontend
- Copy `frontend/.env.example` to `frontend/.env.local`
- Update `VITE_API_URL` to your deployed backend URL.
- Set `VITE_PAYPAL_CLIENT_ID` to your PayPal client ID.

## 2. Backend environment variables

Required values in `backend/.env`:

- `PORT=5000`
- `MONGO_URI`: Your MongoDB connection string.
- `JWT_SECRET`: A strong random secret for signing JWT tokens.
- `ALLOWED_ORIGINS`: Comma-separated frontend domains allowed by CORS.
- `BACKEND_URL`: Your hosted backend URL, used for CSP.- `PAYPAL_CLIENT_ID`: Your PayPal client ID used by the backend config route.- `EMAIL_USER`: Gmail address for Nodemailer (production email sender).
- `EMAIL_PASS`: Gmail App Password.
- `TWILIO_SID`: Twilio Account SID for SMS.
- `TWILIO_AUTH_TOKEN`: Twilio auth token.
- `TWILIO_PHONE_NUMBER`: Verified Twilio sender phone number.

> Note: The backend supports static fallback data when MongoDB is unavailable, but production should use a real MongoDB instance.

## 3. Frontend environment variables

Required values in `frontend/.env.local`:

- `VITE_API_URL`: `https://api.yourdomain.com` or your actual backend URL.
- `VITE_PAYPAL_CLIENT_ID`: Your PayPal client ID for production.

## 4. Production deployment checklist

1. Build both apps:
   - `cd backend && npm install`
   - `cd frontend && npm install`
   - `cd frontend && npm run build`
2. Deploy the backend to your host (Heroku, Railway, DigitalOcean, etc.)
3. Deploy the frontend to your host (Netlify, Vercel, or static host)
4. Set production environment variables on the host platform, not in source control.
5. Configure DNS records for your domain to point to the frontend and backend hosts.
6. Enable HTTPS / TLS for both frontend and backend.
7. Update `backend/.env`:
   - set `ALLOWED_ORIGINS` to the exact frontend domain(s)
   - set `BACKEND_URL` to the backend domain
8. Update `frontend/.env.local` so `VITE_API_URL` points to the backend domain.
9. Verify PayPal credentials and run a sandbox test payment first.
10. Test the full user journey after deployment:
    - signup/login
    - shop filtering/search
    - add to cart
    - checkout
    - order history
    - staff dashboard (if applicable)

## 5. Domain and CORS notes

- Set `ALLOWED_ORIGINS` in `backend/.env` to your production frontend domain(s):
  - Example: `https://yourdomain.com,https://www.yourdomain.com`
- Make sure the backend host allows requests from the frontend.
- Keep `JWT_SECRET` secret; never commit it.

## 6. PayPal configuration

- Use `VITE_PAYPAL_CLIENT_ID` in the frontend and `process.env.PAYPAL_CLIENT_ID` in the backend.
- `frontend/src/main.jsx` uses the PayPal provider to initialize with this key.
- For production, replace any sandbox/test key with your live PayPal client ID.

## 7. Email and SMS notifications

- For email notifications, configure Gmail App Password credentials.
- If email is not configured, notifications will be logged rather than sent.
- For SMS, configure Twilio credentials and a verified Twilio phone number.

## 8. Recommended production hosts

- Frontend: Vercel, Netlify, Cloudflare Pages
- Backend: Railway, Fly.io, Render, DigitalOcean App Platform
- Database: MongoDB Atlas

## 9. Final validation

Before adding the domain, run these checks:

- `frontend` loads successfully and calls the API
- API endpoints respond on the deployed backend
- user login / signup / order flow works
- PayPal checkout is functional with real or sandbox credentials
- 404 page works for unknown routes
- CORS headers allow frontend requests

With these steps completed, the app is ready for production hosting and domain setup.
