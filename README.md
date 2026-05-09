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
3. Create a `.env` file in the `backend` folder (see `.env.example`)
4. Start the development servers with `npm run dev` (frontend) and `npm start` (backend)

## Notification Setup
To enable notifications, ensure the following keys are set in your `.env`:
- `EMAIL_USER`: Your Gmail address
- `EMAIL_PASS`: Your Gmail App Password
- `TWILIO_SID`: Your Twilio Account SID
- `TWILIO_AUTH_TOKEN`: Your Twilio Auth Token
- `TWILIO_PHONE_NUMBER`: Your Twilio phone number
