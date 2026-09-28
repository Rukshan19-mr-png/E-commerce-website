# Plantopia E-Commerce 🌿

A premium MERN stack e-commerce platform for rare and endemic plants in Sri Lanka.

## Features
- ✨ Premium UI with Glassmorphism
- 🛒 Integrated Cart System
- 💳 PayPal Payment Integration
- 🚚 Live Order Tracking
- 📧 Automated Email Notifications (Nodemailer)
- 💬 Automated SMS Notifications (Twilio)

## Setup
1. Clone the repository
2. Install dependencies for both frontend and backend
3. Create a `.env` file in the `backend` folder (see `backend/.env.example`)
4. Create a `.env.local` file in the `frontend` folder (see `frontend/.env.example`)

Quick development steps:

- Install backend dependencies and start the server:

	```bash
	cd backend
	npm install
	npm start
	```

- Install frontend dependencies and start the Vite dev server:

	```bash
	cd frontend
	npm install
	npm run dev
	```

## Deployment & environment variables
For production deployment, follow the deployment guide in `DEPLOYMENT.md`.

### Backend environment variables
- `MONGO_URI`: MongoDB Atlas connection string
- `JWT_SECRET`: strong secret for JWT tokens
- `ALLOWED_ORIGINS`: frontend domains allowed by CORS
- `BACKEND_URL`: hosted backend URL used in CSP
- `PAYPAL_CLIENT_ID`: PayPal client ID used by backend config
- `EMAIL_USER`: Gmail address for Nodemailer
- `EMAIL_PASS`: Gmail App Password
- `TWILIO_SID`: Twilio Account SID
- `TWILIO_AUTH_TOKEN`: Twilio Auth Token
- `TWILIO_PHONE_NUMBER`: Twilio sender number

### Frontend environment variables
- `VITE_API_URL`: your backend URL for production
- `VITE_PAYPAL_CLIENT_ID`: your live PayPal client ID

## Notification Setup
To enable notifications, ensure the following keys are set in your backend `.env`:
- `EMAIL_USER`: Your Gmail address
- `EMAIL_PASS`: Your Gmail App Password
- `TWILIO_SID`: Your Twilio Account SID
- `TWILIO_AUTH_TOKEN`: Your Twilio Auth Token
- `TWILIO_PHONE_NUMBER`: Your Twilio phone number

If you need to run the frontend and backend concurrently during development, you can use a terminal multiplexer (two terminals) or a tool like `concurrently` from npm (install it globally or as a dev dependency).
