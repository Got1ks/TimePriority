# TimePriority - Local Email Server

This repository contains a static frontend (`index.html`, `subscribe.html`) and a minimal Node.js server (`server.js`) to send subscription confirmation emails using SMTP (Hostinger example).

## Setup (local)

1. Install dependencies

   npm install

2. Copy `.env.example` to `.env` and fill in your SMTP credentials (Hostinger). Example values:

   SMTP_HOST=smtp.hostinger.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=info@timepriority.lv
   SMTP_PASS=your_smtp_password
   FROM_EMAIL=info@timepriority.lv
   BUSINESS_EMAIL=info@timepriority.lv
   PORT=3000

3. Run the server

   npm run start

4. Open the frontend

   - Visit http://localhost:3000/subscribe.html?plan=Basic%20Priority to test the form.

## How it works

- The frontend `subscribe.html` sends a POST to `/api/subscribe` with JSON { plan, fname, lname, phone, email }.
- `server.js` uses Nodemailer to send a plain-text confirmation email to the client and optionally notifies the business email.

## Future improvements

- Attach a generated PDF invoice/contract: add an `attachments` array to `mailOptions` in `server.js` and generate PDF server-side.
- Add logging/persistence (database) for subscriptions.
- Add verification (CAPTCHA) and input sanitization for production.

## Security

- Keep SMTP credentials secret. Do NOT commit `.env` with real passwords.
- For production, consider sending emails via a secure transactional provider or use app-specific passwords.
